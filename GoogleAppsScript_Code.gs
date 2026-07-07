/**
 * ====================================================================
 * ISHIKAWA - BACKEND CENTRAL NO GOOGLE SHEETS
 * ====================================================================
 * Este script recebe os registros enviados pelo site (Ishikawa) e
 * grava tudo numa aba "Registros" da planilha, em tempo real,
 * vindo de qualquer tablet/computador que acessar o site.
 *
 * ------------------- COMO INSTALAR (uma única vez) -------------------
 * 1. Acesse https://sheets.google.com e crie uma planilha nova.
 *    Sugestão de nome: "Diagnósticos Ishikawa - Central"
 *
 * 2. No menu da planilha: Extensões > Apps Script.
 *
 * 3. Apague o conteúdo padrão (function myFunction(){}) e cole
 *    TODO o conteúdo deste arquivo no lugar.
 *
 * 4. Troque o valor de TOKEN_SECRET abaixo por uma senha sua
 *    (qualquer texto). Essa MESMA senha deve ser colocada depois
 *    no arquivo do site (constante TOKEN no HTML).
 *
 * 5. Clique em "Implantar" (Deploy) > "Nova implantação" (New deployment).
 *      - Tipo: "App da Web" (Web app)
 *      - Executar como (Execute as): Eu (sua conta)
 *      - Quem pode acessar (Who has access): Qualquer pessoa (Anyone)
 *    Clique em Implantar e autorize as permissões pedidas.
 *
 * 6. Copie a URL gerada (termina com /exec). Essa é a WEBAPP_URL
 *    que você vai colar no arquivo do site.
 *
 * 7. Sempre que você EDITAR este script, é preciso criar uma
 *    NOVA implantação (ou "Gerenciar implantações" > editar > nova
 *    versão) para as mudanças valerem na URL publicada.
 * ====================================================================
 */

// ⚠️ TROQUE por uma senha sua. Use a MESMA senha no arquivo do site (CONFIG.TOKEN).
var TOKEN_SECRET = 'TROQUE_ESTA_SENHA_123';

// Nome da aba onde os registros serão gravados (criada automaticamente se não existir)
var SHEET_NAME = 'Registros';

var M_LABEL = {
  maquina: 'Máquina',
  metodo: 'Método',
  material: 'Material',
  medicao: 'Medição',
  mao_obra: 'Mão de Obra',
  meio_ambiente: 'Meio Ambiente'
};

var HEADERS = [
  'Data', 'Hora', 'Equipamento', 'Inventário SAP', 'Ordem PM',
  'Colaboradores', 'Caso/Defeito', 'M (Categoria)', 'Causa',
  'ID do Registro', 'Recebido em (servidor)'
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'Requisição sem corpo (body) de dados.' });
    }
    var body = JSON.parse(e.postData.contents);

    if (!body.token || body.token !== TOKEN_SECRET) {
      return jsonOut_({ ok: false, error: 'Token inválido.' });
    }

    var sheet = getSheet_();
    var causas = body.causas || {};
    var now = new Date();
    var linhasAdicionadas = 0;

    Object.keys(M_LABEL).forEach(function (m) {
      var lista = causas[m] || [];
      lista.forEach(function (causa) {
        sheet.appendRow([
          body.data || '',
          body.hora || '',
          body.equipamento || '',
          body.inventario || '',
          body.ordemPM || '',
          body.colaboradores || '',
          body.caso || '',
          M_LABEL[m],
          causa,
          body.id || '',
          now
        ]);
        linhasAdicionadas++;
      });
    });

    if (linhasAdicionadas === 0) {
      return jsonOut_({ ok: false, error: 'Nenhuma causa selecionada no registro recebido.' });
    }

    return jsonOut_({ ok: true, linhas: linhasAdicionadas });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  return jsonOut_({ ok: true, info: 'Backend do Ishikawa ativo. Use POST para enviar registros.' });
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
