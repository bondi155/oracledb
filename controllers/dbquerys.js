const fs = require('fs');
const oracledb = require('oracledb');
const dbConfig = require('../config/dbconfig');
const xml2js = require('xml2js');
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
async function getData() {
  let connection;

  try {
    let sql, binds, options, result;

    connection = await oracledb.getConnection(dbConfig);

    // Select 
    sql = `select tr.tra_code,
    tr.tra_desc,
    tr.tra_created, 
    TO_CHAR (tr.tra_updated,  'DD-Mon-YYYY HH24:MI'), 
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

    console.log('RESULTSET:' + JSON.stringify(result));

    let ID_DC40 = [];

    //mapping result rows of select , to insert the data in xml
    ID_DC40 = result.rows.map((column) => ({
      IDOC: {
        ID_DC40: {
          TABNAM: column.TRA_DESC,
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

    console.log(ID_DC40);

    var builder = new xml2js.Builder({
      explicitRoot: false,
      rootName: 'MBGMCR03',
    });

    var xml = builder.buildObject(ID_DC40);

    console.log(xml);

    typeof ID_DC40 != 'undefined' &&
    ID_DC40 != null &&
    ID_DC40.length != null &&
    ID_DC40.length > 0
      ? fs.writeFile('prueba.xml', xml, (err) => {
          if (err) throw err;
          console.log('archivo XML creado');
        })
      : console.log('No hay documentos para conversión a XML');

    let idTcode = Object.values(ID_DC40).map((val) => ({
      id: val.IDOC.ID_DC40.SNDPOR,
    }));

    //let ids =  Object.values(ID_DC40).map(val => (val.id ));

    //const ids = JSON.stringify(idsObj.join(','));

    console.log(idTcode);

    // Update in Oracle DB status to process once a xml is created ( id = transaction code) 

    sql = `UPDATE personas SET TRL_UDFCHKBOX05 = '+' WHERE TRA_CODE IN (:id)`;

    binds = idTcode;
    //    binds =[{"id":ids}];

    // For a complete list of options see the documentation.
    options = {
      autoCommit: true,
      // batchErrors: true,  // continue processing even if there are data errors
      bindDefs: {
        idTcode: { type: oracledb.NUMBER },
      },
      //{ type: oracledb.STRING, maxSize: 20 }
    };

    //result = await connection.execute(sql);

    if (
      typeof idTcode != 'undefined' &&
      idTcode != null &&
      idTcode.length != null &&
      idTcode.length > 0
    ) {
      result = await connection.executeMany(sql, binds, options);
    }

    console.log('Number of rows inserted:', result.rowsAffected);

    //
    // Query the data
    // BUENO ME FALTA HACER IF EN LINEA 146 , ME FALTA HACER UPDATE Y PROBAR CON MULTIPLE VALORES Y AVERIGUAR COMO HACER SERVICIO ESTABLE

    sql = `SELECT * FROM personas`;

    binds = {};

    // For a complete list of options see the documentation.
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true, // query result format
      // extendedMetaData: true,               // get extra metadata
      // prefetchRows:     100,                // internal buffer allocation size for tuning
      // fetchArraySize:   100                 // internal buffer allocation size for tuning
    };

    result = await connection.execute(sql, binds, options);

    console.log('Metadata: ');
    console.dir(result.metaData, { depth: null });
    console.log('Query results: ');
    console.dir(result.rows, { depth: null });

    //
    // Show the date.  The value of ORA_SDTZ affects the output
    //

    sql = `SELECT TO_CHAR(CURRENT_DATE, 'DD-Mon-YYYY HH24:MI') AS CD FROM DUAL`;
    result = await connection.execute(sql, binds, options);
    console.log('Current date query results: ');
    console.log(result.rows[0]['CD']);
  } catch (err) {
    console.error(err);
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

//falta hacer el update a las id 
// Second function for requesitions xml 
async function reqXml() {
  let connection;

  try {
    let sql, binds, options, result;

    connection = await oracledb.getConnection(dbConfig);

    //
    // Select
    //
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
    rl.rql_quotflag,
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
    and rl.rql_quotflag = 0
    and rq.req_code = 12311 
    and rownum <= 10 order by  rq.req_code DESC`;

    //sql = `UPDATE personas SET estado = 'pendiente' WHERE id iN (11134, 11133)`;

    result = await connection.execute(sql, {}, { outFormat: oracledb.OBJECT });

    console.log('RESULTSET:' + JSON.stringify(result));

    let ID_DC40 = [];

    ID_DC40 = result.rows.map((column) => ({
      IDOC: {
        ID_DC40: {
          TABNAM: column.TRA_DESC,
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
        E1PREQCR: {},
        E1BPEBANC: {
          DOC_TYPE: '?',
          MATERIAL: column.TRL_PART,
          PLANT: column.TRL_PART_ORG,
          STGE_LOC: column.TRL_BIN,
          MOVE_TYPE: column.TRL_TYPE,
          ENTRY_QNT: column.TRL_QTY,
          ENTRY_UOM: column.PAR_UOM,
          COSTCENTER: column.TRL_COSTCODE,
        },
        E1BPEBKN: {},
        E1BPEBANTX: {},
        E1BPESUHC: {},
        E1BPESUCC: {},
        E1BPESLLC: {},
        E1BPESKLC: {},
        E1BPESLLTX: {},
      },

      //HACER OTRO MAPEO CON NOMBRE DEL TAG COMO ID_DC40 PERO DE LOS OTROS VALORES
      // ES PRIMERA OPCION PERO HABRIA Q OPTIMIZARLO
    }));

    console.log(ID_DC40);

    var builder = new xml2js.Builder({
      explicitRoot: false,
      rootName: 'PREQCR02',
    });

    var xml = builder.buildObject(ID_DC40);

    console.log(xml);

    typeof ID_DC40 != 'undefined' &&
    ID_DC40 != null &&
    ID_DC40.length != null &&
    ID_DC40.length > 0
      ? fs.writeFile('prueba.xml', xml, (err) => {
          if (err) throw err;
          console.log('archivo XML creado');
        })
      : console.log('No hay documentos para conversión a XML');

    let ids = Object.values(ID_DC40).map((val) => ({
      id: val.IDOC.ID_DC40.SNDPOR,
    }));

    //let ids =  Object.values(ID_DC40).map(val => (val.id ));

    //const ids = JSON.stringify(idsObj.join(','));

    console.log(ids);

    //
    // Insert three rows
    //

    sql = `UPDATE personas SET estado = 1 WHERE id IN (:id)`;

    binds = ids;
    //    binds =[{"id":ids}];

    // For a complete list of options see the documentation.
    options = {
      autoCommit: true,
      // batchErrors: true,  // continue processing even if there are data errors
      bindDefs: {
        id: { type: oracledb.NUMBER },
      },
      //{ type: oracledb.STRING, maxSize: 20 }
    };

    //result = await connection.execute(sql);

    if (
      typeof ids != 'undefined' &&
      ids != null &&
      ids.length != null &&
      ids.length > 0
    ) {
      result = await connection.executeMany(sql, binds, options);
    }

    console.log('Number of rows inserted:', result.rowsAffected);

    //
    // Query the data
    // BUENO ME FALTA HACER IF EN LINEA 146 , ME FALTA HACER UPDATE Y PROBAR CON MULTIPLE VALORES Y AVERIGUAR COMO HACER SERVICIO ESTABLE

    sql = `SELECT * FROM personas`;

    binds = {};

    // For a complete list of options see the documentation.
    options = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true, // query result format
      // extendedMetaData: true,               // get extra metadata
      // prefetchRows:     100,                // internal buffer allocation size for tuning
      // fetchArraySize:   100                 // internal buffer allocation size for tuning
    };

    result = await connection.execute(sql, binds, options);

    console.log('Metadata: ');
    console.dir(result.metaData, { depth: null });
    console.log('Query results: ');
    console.dir(result.rows, { depth: null });

    //
    // Show the date.  The value of ORA_SDTZ affects the output
    //

    sql = `SELECT TO_CHAR(CURRENT_DATE, 'DD-Mon-YYYY HH24:MI') AS CD FROM DUAL`;
    result = await connection.execute(sql, binds, options);
    console.log('Current date query results: ');
    console.log(result.rows[0]['CD']);
  } catch (err) {
    console.error(err);
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
  getData: getData,
  reqXml: reqXml,
};
