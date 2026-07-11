

require("./instrument");
require("dotenv").config();
const app = require("./api/app");

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Passtime API running on port ${PORT}`);
  });
}

module.exports = app;
