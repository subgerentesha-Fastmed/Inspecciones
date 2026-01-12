function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Gestor SST Prosalmed Elite')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function processForm(data) {
  try {
    Logger.log("Inspección recibida: " + data.cliente);
    return { success: true };
  } catch (e) {
    throw new Error("Error: " + e.message);
  }
}