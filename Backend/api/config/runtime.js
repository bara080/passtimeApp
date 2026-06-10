function isServerlessRuntime() {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.AWS_EXECUTION_ENV)
  );
}

function shouldGracefulInfraBootstrap() {
  if (isServerlessRuntime()) return true;
  if (process.env.INFRA_FAIL_FAST === "1") return false;
  if (process.env.AWS_EC2_DEPLOYMENT === "1") return true;
  return process.env.NODE_ENV === "production";
}

module.exports = { isServerlessRuntime, shouldGracefulInfraBootstrap };
