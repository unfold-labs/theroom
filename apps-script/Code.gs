var REGISTRY_ID = '1t35mJ8TIY60ePOrEgTPZ_oGUX69atXMhAdQmYS8Ralo';

var WORDS = [
  'DRUM', 'MILO', 'APEX', 'COVE', 'FLINT', 'GROVE', 'HALO', 'INK', 'JADE', 'KITE',
  'LARK', 'MESH', 'NOON', 'OAK', 'PINE', 'QUAY', 'REEF', 'SAGE', 'TIDE', 'URN',
  'VALE', 'WAVE', 'YARN', 'ZINC', 'BOLT', 'CALM', 'DUSK', 'ECHO', 'FERN', 'GUST',
  'HIVE', 'IRIS', 'JEST', 'KELP', 'LIME', 'MAST', 'NOOK', 'OPAL', 'PEAT', 'QUILL',
  'RUNE', 'SALT', 'TARN', 'UMBER', 'VANE', 'WREN', 'YOKE', 'ZEST', 'BIRCH', 'CLAY'
];

function doGet(e) {
  var p = e.parameter;
  var result;
  try {
    switch (p.action) {
      case 'create':  result = createSession(); break;
      case 'resolve': result = resolveCode(p.code); break;
      case 'start':   result = setStatus(p.sheetId, 'ACTIVE'); break;
      case 'stop':    result = setStatus(p.sheetId, 'ENDED'); break;
      case 'poll':    result = pollStatus(p.sheetId); break;
      case 'log':     result = logPoint(p.sheetId, p.participant, parseFloat(p.value)); break;
      default:        result = { error: 'unknown action' };
    }
  } catch (err) {
    result = { error: err.message };
  }
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function createSession() {
  var registry = SpreadsheetApp.openById(REGISTRY_ID).getSheetByName('registry');
  var values = registry.getDataRange().getValues();
  var usedCodes = values.slice(1).map(function(r) { return r[0]; });
  var available = WORDS.filter(function(w) { return usedCodes.indexOf(w) === -1; });
  if (available.length === 0) return { error: 'no codes available' };

  var code = available[Math.floor(Math.random() * available.length)];
  var now = new Date().toISOString();

  var ss = SpreadsheetApp.create('The Room — ' + code);
  var sheet = ss.getSheets()[0];
  sheet.setName(code);
  sheet.appendRow(['type', 'participant', 'timestamp', 'value']);
  sheet.appendRow(['STATUS', '', now, 'WAITING']);

  registry.appendRow([code, ss.getId(), 'WAITING', now]);
  return { code: code, sheetId: ss.getId() };
}

function resolveCode(code) {
  var registry = SpreadsheetApp.openById(REGISTRY_ID).getSheetByName('registry');
  var values = registry.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === code) {
      return { sheetId: values[i][1], status: values[i][2] };
    }
  }
  return { error: 'not found' };
}

function pollStatus(sheetId) {
  var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
  var data = sheet.getDataRange().getValues();
  // data[0] = header row, data[1] = STATUS row ['STATUS', '', timestamp, 'WAITING']
  var status = data[1][3];
  var participants = {};
  for (var i = 2; i < data.length; i++) {
    if (data[i][0] === 'DATA' && data[i][1]) {
      participants[data[i][1]] = true;
    }
  }
  return { status: status, count: Object.keys(participants).length };
}

function setStatus(sheetId, status) {
  var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
  sheet.getRange(2, 4).setValue(status);
  SpreadsheetApp.flush();

  var registry = SpreadsheetApp.openById(REGISTRY_ID).getSheetByName('registry');
  var values = registry.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][1]).trim() === String(sheetId).trim()) {
      registry.getRange(i + 1, 3).setValue(status);
      SpreadsheetApp.flush();
      break;
    }
  }
  return { ok: true };
}

function logPoint(sheetId, participant, value) {
  var sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
  sheet.appendRow(['DATA', participant, new Date().toISOString(), value]);
  return { ok: true };
}
