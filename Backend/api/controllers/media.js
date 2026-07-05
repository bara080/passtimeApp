require("dotenv").config();
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const admin = require("../config/firebase");
const { getUserModel } = require("../config/db");
const { success, error } = require("../utils/responseFormatter");

const ALLOWED_CONTENT_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const UPLOAD_URL_TTL_MS = 10 * 60 * 1000;
const KINDS = new Set(["avatar", "photo"]);

function getBucket() {
  const name = process.env.FIREBASE_BUCKET_URL;
  return name ? admin.storage().bucket(name) : admin.storage().bucket();
}

// ── Create signed upload URL ──────────────────────────────────────────────────
exports.createUploadUrl = async (req, res, next) => {
  try {
    const { kind, contentType } = req.body;
    if (!KINDS.has(kind)) return error(res, 400, "kind must be 'avatar' or 'photo'.");
    const ext = ALLOWED_CONTENT_TYPES[contentType];
    if (!ext) return error(res, 400, "contentType must be image/jpeg, image/png or image/webp.");

    const path =
      kind === "avatar"
        ? `avatars/${req.user.uid}.${ext}`
        : `media/${req.user.uid}/${uuidv4()}.${ext}`;

    const [uploadUrl] = await getBucket()
      .file(path)
      .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + UPLOAD_URL_TTL_MS,
        contentType,
      });

    return success(res, "Upload URL created.", { uploadUrl, path, contentType });
  } catch (err) {
    next(err);
  }
};

// ── Confirm upload: mint permanent download URL (+ avatarUrl for avatars) ────
exports.confirmUpload = async (req, res, next) => {
  try {
    const { path } = req.body;
    if (typeof path !== "string" || !path.length) return error(res, 400, "path is required.");

    // Users may only confirm their own objects
    const ownsPath =
      path.startsWith(`avatars/${req.user.uid}.`) || path.startsWith(`media/${req.user.uid}/`);
    if (!ownsPath) return error(res, 403, "You can only confirm your own uploads.");

    const bucket = getBucket();
    const file = bucket.file(path);
    const [exists] = await file.exists();
    if (!exists) return error(res, 404, "No uploaded file at that path.");

    const token = crypto.randomUUID();
    await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      path
    )}?alt=media&token=${token}`;

    if (path.startsWith("avatars/")) {
      const UserModel = getUserModel(req.userRole);
      await UserModel.updateOne({ uid: req.user.uid }, { avatarUrl: url });
    }

    return success(res, "Upload confirmed.", { url, path });
  } catch (err) {
    next(err);
  }
};
