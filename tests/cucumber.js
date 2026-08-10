// cucumber.js
module.exports = {
    default: {
      requireModule: ["tsx/cjs"],
      require: ["../tests/bdd/steps/**/*.ts"], // Caminho para os steps (cwd esperado: backend/)
      format: ["progress", "json:../tests/bdd/reports/cucumber-report.json"],
      paths: ["../tests/bdd/features/**/*.feature"], // Caminho para os arquivos .feature
      publishQuiet: true,
    },
  };