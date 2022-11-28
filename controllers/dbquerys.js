const fs = require('fs');
const oracledb = require('oracledb');
const dbConfig = require('../config/dbconfig');
const xml2js = require('xml2js');
const logger = require ('./logger');
//config oracle cliente
let libPath;
if (process.platform === 'win32') {
  // Windows
  libPath = 'C:\\oracle\\instantclient_12_2';
} else if (process.platform === 'darwin') {
  // macOS
  libPath = process.env.HOME + '/Downloads/instantclient_19_8';
}
if (libPath && fs.existsSync(libPath)) {
  oracledb.initOracleClient({ libDir: libPath });
}
// end config client

oracledb.autoCommit = true;
process.env.ORA_SDTZ = 'UTC';

//function for transaction XML (MBGMCR03 movement)
async function transactionXml() {
  let connection;

  try {
    let sql, binds, options, result;

    connection = await oracledb.getConnection(dbConfig);
    logger.transactionLog.log('info', 'succefull connection') ;


    // Select
    sql = `select tr.tra_code,
    tr.tra_desc,
    tr.tra_created, 
    TO_CHAR (tr.tra_updated, 'DD-Mon-YYYY HH24:MI'), 
    tr.tra_type, 
    tr.tra_org,
    tr.tra_status,
    tl.trl_trans,
    tl.trl_line,
    tl.trl_part,
    tl.trl_part_org,
    tl.trl_type,
    tl.trl_qty,
    tl.trl_costcode,
    tl.trl_bin,
    tl.trl_sourcecode,
    pa.par_code,
    pa.par_uom
    from r5transactions tr, r5translines tl, r5parts pa
    where tr.tra_code = 1051757
    and tl.trl_trans = tr.tra_code
    and tl.trl_part = pa.par_code
    and tr.tra_status = 'A'
    and TRL_UDFCHKBOX05 = '-'
    order by tr.tra_code DESC`;

    result = await connection.execute(sql, {}, { outFormat: oracledb.OBJECT });

    //console.log('RESULTSET:' + JSON.stringify(result));

    let EDI_DC40 = [];

    //mapping result rows of select , to insert the data in xml
    EDI_DC40 = result.rows.map((column) => ({
      IDOC: {
        EDI_DC40: {
          TABNAM: column.TRA_DESC,
          MANDT: {},
          DOCNUM: {},
          DOCREL: {},
          STATUS: {},
          DIRECT: {},
          OUTMOD: {},
          IDOCTYP: column.TRA_TYPE,
          MESTYP: column.TRA_TYPE,
          SNDPOR: column.TRA_CODE,
          SNDPRT: '***LS',
          SNDPRN: '**ERDCLNT100',
          RCVPOR: '****SAPERD',
          RCVPRT: '***LS',
          RCVPRN: '**ERDCLNT100',
          CREDAT: {},
          CRETIM: {},
        },
        E1MBGMCR: {
          E1BP2017_GM_HEAD_01: {
            PSTNG_DATE: column.TRA_UPDATED,
            DOC_DATE: column.TRA_DATE,
            HEADER_TXT: column.TRA_DESC,
          },
          E1BP2017_GM_CODE: {
            GM_CODE: '***03',
          },
          _SPE_E1BP2017_GM_REF_EWM: {},
          E1BP2017_GM_ITEM_CREATE: {
            MATERIAL: column.TRL_PART,
            PLANT: column.TRL_PART_ORG,
            STGE_LOC: column.TRL_BIN,
            MOVE_TYPE: column.TRL_TYPE,
            ENTRY_QNT: column.TRL_QTY,
            ENTRY_UOM: column.PAR_UOM,
            COSTCENTER: column.TRL_COSTCODE,
            E1BP2017_GM_ITEM_CREATE1: {},
          },
          E1BP2017_GM_SERIALNUMBER: {},
          _SPE_E1BP2017_SERVICEPART_D: {},
          E1BPPAREX: {},
        },
      },
    }));

    console.log(EDI_DC40);

    //xml constructor
    var builder = new xml2js.Builder({
      explicitRoot: false,
      rootName: 'MBGMCR03',
    });

    var xml = builder.buildObject(EDI_DC40);

    console.log(xml);

    typeof EDI_DC40 != 'undefined' &&
    EDI_DC40 != null &&
    EDI_DC40.length != null &&
    EDI_DC40.length > 0
      ? fs.writeFile('pruebaTra.xml', xml, (err) => {
          if (err) throw err;
          console.log('archivo XML creado');
        })
      : console.log('No hay documentos para conversión a XML')
      logger.transactionLog.log('info', 'No hay documentos para conversión a XML');

    //format map to array object
    let idTcode = Object.values(EDI_DC40).map((val) => ({
      id: val.IDOC.EDI_DC40.SNDPOR,
    }));
    console.log(idTcode);

    // Update in Oracle DB status to process once a xml is created ( id = transaction code)

    sql = `UPDATE r5translines SET TRL_UDFCHKBOX05 = '+' WHERE TRL_TRANS IN (:id)`;

    //binds format [{"id":ids}];
    binds = idTcode;

    // For a complete list of options see the documentation.
    options = {
      autoCommit: true,
      // batchErrors: true,  // continue processing even if there are data errors
      //bindDefs: {
      //idTcode: { type: oracledb.NUMBER },
      //},
      //{ type: oracledb.STRING, maxSize: 20 }
    };

    if (
      typeof idTcode != 'undefined' &&
      idTcode != null &&
      idTcode.length != null &&
      idTcode.length > 0
    ) {
      result = await connection.executeMany(sql, binds, options);
      console.log('Number of rows inserted:', result.rowsAffected);
      logger.transactionLog.log('info', 'rows modificados', result.rowsAffected);
      logger.transactionLog.log('info', 'IDs procesados de transactions', idTcode);
    }

    //
    // Query the data

    //console.log('Metadata: ');
    //console.dir(result.metaData, { depth: null });
    console.log('Query results: ');
    console.dir(result.rows, { depth: null });

    //
    // Show the date.  The value of ORA_SDTZ affects the output
    //

    
  } catch (err) {
    console.error(err);
    logger.transactionLog.log('error', (err))
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

// Second function for requesitions xml
async function requisitionXml() {
  let connection;

  try {
    let sql, binds, options, result;

    connection = await oracledb.getConnection(dbConfig);

    // Select
    sql = `select rq.req_code,
    rq.req_desc,
    rq.req_date,
    rq.req_status,
    rq.req_fromentity,
    rq.req_type,
    rq.req_toentity,
    rq.req_tocode,
    rq.req_interface,
    rq.req_org,
    rq.req_interface,
    rq.req_udfchkbox05,
    rl.rql_type,
    rl.rql_req,
    rl.rql_reqline,
    rl.rql_part,
    rl.rql_part_org,
    rl.rql_qty,
    rl.rql_uom,
    rl.rql_due
    from r5requisitions rq, r5requislines rl
    where rq.req_code = rl.rql_req
    and rq.req_status = 'A'
    and rq.req_udfchkbox05 = '-'
    and rq.req_code = 12311
    and rownum <= 10 order by rq.req_code DESC`;

    result = await connection.execute(sql, {}, { outFormat: oracledb.OBJECT });

    //console.log('RESULTSET:' + JSON.stringify(result));

    let EDI_DC40 = [];

    EDI_DC40 = result.rows.map((column) => ({
      IDOC: {
        EDI_DC40: {
          TABNAM: column.REQ_DESC,
          MANDT: {},
          DOCNUM: column.REQ_CODE,
          DOCREL: {},
          STATUS: column.REQ_STATUS,
          DIRECT: {},
          OUTMOD: {},
          IDOCTYP: column.REQ_TYPE,
          MESTYP: column.REQ_TYPE,
          SNDPOR: column.REQ_CODE,
          SNDPRT: '***LS',
          SNDPRN: '**ERDCLNT100',
          RCVPOR: '****SAPERD',
          RCVPRT: '***LS',
          RCVPRN: '**ERDCLNT100',
          CREDAT: column.REQ_DATE,
          CRETIM: {},
        },
        E1PREQCR: {},
        E1BPEBANC: {
          DOC_TYPE: column.RQL_TYPE,
          MATERIAL: column.RQL_PART,
          PLANT: column.RQL_PART_ORG,
          STGE_LOC: 'falta',
          TRACKINGNO: column.RQL_REQ,
          QUANTITY: column.RQL_QTY,
          UNIT: column.RQL_UOM,
          DELIV_DATE: column.RQL_DUE,
        },
        E1BPEBKN: {},
        E1BPEBANTX: {},
        E1BPESUHC: {},
        E1BPESUCC: {},
        E1BPESLLC: {},
        E1BPESKLC: {},
        E1BPESLLTX: {},
      },
    }));

    console.log(EDI_DC40);

    var builder = new xml2js.Builder({
      explicitRoot: false,
      rootName: 'PREQCR02',
    });

    var xml = builder.buildObject(EDI_DC40);

    console.log(xml);

    typeof EDI_DC40 != 'undefined' &&
    EDI_DC40 != null &&
    EDI_DC40.length != null &&
    EDI_DC40.length > 0
      ? fs.writeFile('pruebaReq.xml', xml, (err) => {
          if (err) throw err;
          console.log('archivo XML creado');
        })
      : console.log('No hay documentos para conversión a XML')
      logger.transactionLog.log('info', 'No hay documentos para conversión a XML');


    let idReqcode = Object.values(EDI_DC40).map((val) => ({
      id: val.IDOC.EDI_DC40.SNDPOR,
    }));

    console.log(idReqcode);
    //logger.transactionLog.log('info', 'IDs por procesar', idReqcode);


    // Update status of proccess req_codes

    sql = `UPDATE r5requisitions SET REQ_UDFCHKBOX05 = '+' WHERE req_code IN (:id)`;

    binds = idReqcode;
    //format binds =[{"id":idTcode[0]}];

    // For a complete list of options see the documentation.
    options = {
    autoCommit: true,
    };

    if (
      typeof idReqcode != 'undefined' &&
      idReqcode != null &&
      idReqcode.length != null &&
      idReqcode.length > 0
    ) {
      result = await connection.executeMany(sql, binds, options);
      console.log('Number of rows inserted:', result.rowsAffected);
      logger.transactionLog.log('info', 'rows modificados', result.rowsAffected);
      logger.transactionLog.log('info', 'IDs procesados de requision', idReqcode);


    }

  } catch (err) {
    console.error(err);
    logger.transactionLog.log('error', (err))
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

module.exports = {
  transactionXml:transactionXml,
  requisitionXml: requisitionXml,
};
