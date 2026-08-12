const { getUserModel } = require("../config/db");
const { success, error } = require("../utils/responseFormatter");

const DOCUMENT_TYPES = ["passport", "drivers_license", "national_id"];
const HTTPS_RE = /^https:\/\/.+/i;

function publicIdentity(identity) {
  const id = identity || {};
  return {
    status: id.status || "unverified",
    documentType: id.documentType || null,
    submittedAt: id.submittedAt || null,
    reviewedAt: id.reviewedAt || null,
    rejectionReason: id.rejectionReason || null,
  };
}

// ── GET /api/identity ────────────────────────────────────────────────────────
exports.getStatus = async (req, res, next) => {
  try {
    return success(res, "OK", { identity: publicIdentity(req.user.identity) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/identity/submit ────────────────────────────────────────────────
// Accepts the document type + uploaded document image URLs (from the media
// pipeline) and moves the user to `pending` review. Idempotent-ish: resubmitting
// while already `verified` is rejected; from any other state it re-opens review.
exports.submit = async (req, res, next) => {
  try {
    const { documentType, frontUrl, backUrl, selfieUrl } = req.body;

    if (!DOCUMENT_TYPES.includes(documentType)) {
      return error(res, 400, `documentType must be one of: ${DOCUMENT_TYPES.join(", ")}.`);
    }
    if (!frontUrl || !HTTPS_RE.test(frontUrl)) {
      return error(res, 400, "frontUrl is required and must be an https URL.");
    }
    // Passport is single-page; license/national-id need the back too.
    if (documentType !== "passport" && (!backUrl || !HTTPS_RE.test(backUrl))) {
      return error(res, 400, "backUrl is required for this document type.");
    }
    if (selfieUrl && !HTTPS_RE.test(selfieUrl)) {
      return error(res, 400, "selfieUrl must be an https URL.");
    }

    const current = req.user.identity?.status;
    if (current === "verified") {
      return error(res, 409, "Your identity is already verified.");
    }
    if (current === "pending") {
      return error(res, 409, "A verification is already under review.");
    }

    const UserModel = getUserModel(req.userRole);
    const user = await UserModel.findOneAndUpdate(
      { uid: req.user.uid },
      {
        $set: {
          "identity.status": "pending",
          "identity.documentType": documentType,
          "identity.documents.front": frontUrl,
          "identity.documents.back": backUrl || null,
          "identity.documents.selfie": selfieUrl || null,
          "identity.submittedAt": new Date(),
          "identity.reviewedAt": null,
          "identity.rejectionReason": null,
        },
      },
      { new: true }
    );
    if (!user) return error(res, 404, "User not found.");

    return success(res, "Identity submitted for review.", { identity: publicIdentity(user.identity) });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/identity/_test_review (dev only) ───────────────────────────────
// Stands in for a human/third-party KYC reviewer so the flow is exercisable
// end-to-end without a real provider. Blocked in production.
exports.testReview = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === "production") return error(res, 404, "Not found.");
    const { decision, reason } = req.body;
    if (!["verified", "rejected"].includes(decision)) {
      return error(res, 400, "decision must be 'verified' or 'rejected'.");
    }
    const UserModel = getUserModel(req.userRole);
    const user = await UserModel.findOneAndUpdate(
      { uid: req.user.uid },
      {
        $set: {
          "identity.status": decision,
          "identity.reviewedAt": new Date(),
          "identity.rejectionReason": decision === "rejected" ? reason || "Document unclear." : null,
        },
      },
      { new: true }
    );
    if (!user) return error(res, 404, "User not found.");
    return success(res, "Reviewed.", { identity: publicIdentity(user.identity) });
  } catch (err) {
    next(err);
  }
};
