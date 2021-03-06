const {
  exec_query,
  generate_query_insert,
  generate_query_update,
  get_query,
} = require("../../models");
const moment = require("moment");
const { sumByKey, generateId } = require("../../utils");

async function getItem(data = Object) {
  let _sql = `SELECT * 
      FROM mst_item AS a
      LEFT JOIN mst_item_variant AS b ON a.mst_item_id = b.mst_item_id
      WHERE 1+1=2 `;
  if (data.hasOwnProperty("mst_item_id")) {
    _sql += ` AND a.mst_item_id = '${data.mst_item_id}'`;
  }
  if (data.hasOwnProperty("mst_item_variant_id")) {
    _sql += ` AND b.mst_item_variant_id = '${data.mst_item_variant_id}'`;
  }
  if (data.hasOwnProperty("barcode")) {
    _sql += ` AND b.barcode = '${data.barcode}'`;
  }
  let _data = await exec_query(_sql);
  return _data;
}

async function getCashier(data = Object) {
  let _sql = `SELECT 
      *,
      a.status AS status,
      a.created_at AS created_at,
      a.created_by AS created_by,
      a.updated_at AS updated_at,
      a.updated_by AS updated_by
      FROM pos_cashier AS a
      LEFT JOIN "user" AS b ON a.created_by = b.user_id
      WHERE a.flag_delete='0' `;
  if (data.hasOwnProperty("pos_cashier_id")) {
    _sql += ` AND a.pos_cashier_id = '${data.pos_cashier_id}'`;
  }
  if (data.hasOwnProperty("user_id")) {
    _sql += ` AND b.user_id = '${data.user_id}'`;
  }
  if (data.hasOwnProperty("created_by")) {
    _sql += ` AND a.created_by = '${data.created_by}'`;
  }
  if (data.hasOwnProperty("is_cashier_open")) {
    _sql += ` AND a.is_cashier_open IS ${data.is_cashier_open}`;
  }
  let _data = await exec_query(_sql);
  return _data;
}

async function getSale(data = Object) {
  let _sql = `SELECT 
  *,
  a.status AS status,
  a.flag_delete AS flag_delete,
  a.created_at AS created_at,
  a.created_by AS created_by
      FROM pos_trx_sale AS a
      LEFT JOIN mst_customer AS b ON a.mst_customer_id = b.mst_customer_id
      WHERE a.flag_delete='0' `;
  if (data.hasOwnProperty("pos_trx_sale_id")) {
    _sql += ` AND a.pos_trx_sale_id = '${data.pos_trx_sale_id}'`;
  }
  if (data.hasOwnProperty("mst_customer_id")) {
    _sql += ` AND b.mst_customer_id = '${data.mst_customer_id}'`;
  }
  if (data.hasOwnProperty("is_paid")) {
    _sql += ` AND a.is_paid = '${data.is_paid}'`;
  }
  let _data = await exec_query(_sql);
  return _data;
}
async function getReturn(data = Object) {
  let _sql = `SELECT 
  *,
  a.status AS status,
  a.flag_delete AS flag_delete,
  a.created_at AS created_at,
  a.created_by AS created_by
      FROM pos_trx_return AS a
      LEFT JOIN mst_customer AS b ON a.mst_customer_id = b.mst_customer_id
      WHERE a.flag_delete='0' `;
  if (data.hasOwnProperty("pos_trx_return_id")) {
    _sql += ` AND a.pos_trx_return_id = '${data.pos_trx_return_id}'`;
  }
  if (data.hasOwnProperty("pos_trx_sale_id")) {
    _sql += ` AND a.pos_trx_sale_id = '${data.pos_trx_sale_id}'`;
  }
  if (data.hasOwnProperty("mst_customer_id")) {
    _sql += ` AND b.mst_customer_id = '${data.mst_customer_id}'`;
  }
  if (data.hasOwnProperty("is_returned")) {
    _sql += ` AND a.is_returned = '${data.is_returned}'`;
  }
  let _data = await exec_query(_sql);
  return _data;
}

async function getCustomer(data = Object) {
  let _sql = `SELECT * FROM mst_customer AS a WHERE a.flag_delete = '0' `;
  if (data.hasOwnProperty("mst_customer_id")) {
    _sql += ` AND a.mst_customer_id = '${data.mst_customer_id}'`;
  }
  let _data = await exec_query(_sql);
  return _data;
}

async function getDiscount(data = Object) {
  let _sql = `SELECT *, a.status AS status, a.flag_delete AS flag_delete
  FROM pos_discount AS a 
  LEFT JOIN mst_item_variant AS b ON a.mst_item_variant_id = b.mst_item_variant_id
  LEFT JOIN mst_item AS c ON b.mst_item_id = c.mst_item_id
  WHERE a.flag_delete='0' `;
  if (data.hasOwnProperty("pos_discount_id")) {
    _sql += ` AND a.pos_discount_id = '${data.pos_discount_id}'`;
  }
  if (data.hasOwnProperty("mst_item_variant_id")) {
    _sql += ` AND b.mst_item_variant_id = '${data.mst_item_variant_id}'`;
  }
  if (data.hasOwnProperty("barcode")) {
    _sql += ` AND b.barcode = '${data.barcode}'`;
  }
  if (data.hasOwnProperty("mst_item_id")) {
    _sql += ` AND a.mst_item_id = '${data.mst_item_id}'`;
  }
  if (data.hasOwnProperty("status")) {
    _sql += ` AND a.status = '${data.status}'`;
  }
  let _data = await exec_query(_sql);
  return _data;
}

async function getSaleByCashier(data = Object) {
  let _data = await getCashier(data);
  if (_data.error || _data.data.length == 0) {
    return _data;
  }
  let created_by = _data.data[0].created_by ?? 0;
  let newData = [];
  for (const it of _data.data) {
    let _fr = "YYYY-MM-DD hh:mm:ss";
    let dt_start = moment(it.created_at).format(_fr);
    let dt_end = moment(it.updated_at).format(_fr);
    let _get_sale = `SELECT *,a.status AS status
    FROM pos_trx_sale AS a
    LEFT JOIN mst_customer AS b ON a.mst_customer_id = b.mst_customer_id
    WHERE a.created_by='${created_by}' AND a.created_at >= '${dt_start}'`;
    if (dt_end != "Invalid date") {
      _get_sale += ` AND a.created_at <= '${dt_end}'`;
    }
    if (data.hasOwnProperty("is_paid")) {
      _get_sale += ` AND a.is_paid IS ${data.is_paid}`;
    }
    _get_sale = await exec_query(_get_sale);
    let _sale = [];
    for (const ch of _get_sale.data) {
      let child = await getTrxDetailItem({
        pos_trx_ref_id: ch.pos_trx_sale_id,
      });
      ch.detail = child.data;
      _sale.push(ch);
    }
    it.sale = _sale;
    newData.push(it);
  }
  _data.data = newData;
  return _data;
}

async function getStockItem(data = Object) {
  let _sql = `SELECT
        MAX(a.pos_item_stock_id) AS pos_item_stock_id,
        MAX(a.mst_item_id) AS mst_item_id,
        MAX(b.mst_item_name) AS mst_item_name,
        MAX(b.mst_item_desc) AS mst_item_desc,
        MAX(b.mst_item_no) AS mst_item_no,
        MAX(a.qty) AS qty,
        STRING_AGG(coalesce(c.mst_item_variant_id::character varying,''), ';') as mst_item_variant_id,
        STRING_AGG(coalesce(c.barcode::character varying,''), ';') as barcode,
        STRING_AGG(coalesce(c.mst_item_variant_name,''),';') AS mst_item_variant_name,
        STRING_AGG(coalesce(c.mst_item_variant_qty::character varying,''), ';') as mst_item_variant_qty,
        STRING_AGG(coalesce(d.pos_discount_id ::character varying,''), ';') as pos_discount_id,
        STRING_AGG(coalesce(d.pos_discount::character varying,''), ';') as pos_discount,
        STRING_AGG(coalesce(d.pos_discount_starttime ::character varying,''), ';') as pos_discount_starttime,
        STRING_AGG(coalesce(d.pos_discount_endtime  ::character varying,''), ';') as pos_discount_endtime,
        STRING_AGG(coalesce(d.pos_discount_min_qty  ::character varying,''), ';') as pos_discount_min_qty,
        STRING_AGG(coalesce(d.pos_discount_free_qty  ::character varying,''), ';') as pos_discount_free_qty,
        STRING_AGG(coalesce(c.mst_item_variant_price  ::character varying,''), ';') as mst_item_variant_price,
        STRING_AGG(coalesce(c.mst_item_variant_price  ::character varying,''), ';') as price,
        STRING_AGG(coalesce(c.mst_item_variant_price::float * (d.pos_discount::float/100),0)::character varying, ';') as discount_price,
        STRING_AGG(coalesce(c.mst_item_variant_price::float-c.mst_item_variant_price::float * (d.pos_discount::float/100),c.mst_item_variant_price)::character varying, ';') as after_discount_price
    FROM pos_item_stock AS a  
    LEFT JOIN mst_item AS b ON a.mst_item_id= b.mst_item_id 
    LEFT JOIN mst_item_variant AS c ON b.mst_item_id = c.mst_item_id
    LEFT JOIN pos_discount AS d 
      ON c.mst_item_variant_id = d.mst_item_variant_id
      AND d.status = '1'
      AND (d.pos_discount_starttime <= now() AND pos_discount_endtime > now())
      AND d.flag_delete = '0'
    WHERE 1+1=2  `;
  if (data.hasOwnProperty("mst_item_id") && data.mst_item_id) {
    _sql += ` AND b.mst_item_id = '${data.mst_item_id}'`;
  }
  if (data.hasOwnProperty("mst_item_variant_id") && data.mst_item_variant_id) {
    _sql += ` AND c.mst_item_variant_id = '${data.mst_item_variant_id}'`;
  }
  if (data.hasOwnProperty("barcode") && data.barcode) {
    _sql += ` AND c.barcode = '${data.barcode}'`;
  }
  _sql += ` GROUP BY a.pos_item_stock_id`;
  let _data = await exec_query(_sql);
  return _data;
}

async function proccessToInbound(data) {
  let _data = { ...data };
  _data.pos_trx_inbound_id = generateId();
  _data.pos_trx_id = _data.pos_trx_inbound_id;
  if (data.hasOwnProperty("mst_supplier_id")) {
    _data.mst_supplier_id = data.mst_supplier_id;
    _data.pos_trx_inbound_type = "receive";
    _data.pos_ref_table = "pos_receive";
    _data.pos_ref_id = _data.pos_receive_id;
  } else if (data.hasOwnProperty("pos_trx_return_id")) {
    _data.mst_customer_id = data.mst_customer_id;
    _data.pos_trx_inbound_type = "return";
    _data.pos_ref_id = _data.pos_trx_return_id;
  }
  // else if (data.hasOwnProperty("mst_warehouse_id")) {
  //   _data.mst_warehouse_id = data.mst_warehouse_id;
  //   _data.pos_trx_inbound_type = "warehouse";
  // }

  let _insert = await generate_query_insert({
    table: "pos_trx_inbound",
    values: _data,
  });
  return _insert;
}

async function proccessToStock(data) {
  let _datas = {};
  if (data.hasOwnProperty("pos_receive_id")) {
    _datas = await getDetailReceive({ pos_receive_id: data.pos_receive_id });
  } else if (data.hasOwnProperty("pos_trx_return_id")) {
    _datas = await getTrxDetailItem({ pos_trx_ref_id: data.pos_trx_return_id });
  }

  let reduce = sumByKey({
    key: "mst_item_id",
    array: _datas.data,
    sum: "qty",
  });
  let _sql = "";
  for (const it of reduce) {
    let _item = await getStockItem(it);
    if (_item.data.length == 0) {
      _sql += await generate_query_insert({
        values: it,
        table: "pos_item_stock",
      });
    } else {
      let body = { ..._item.data[0], ...it };
      body.qty += _item.data[0].qty ?? 0;
      body.status = 1;
      _sql += await generate_query_update({
        values: body,
        table: "pos_item_stock",
        key: "pos_item_stock_id",
      });
    }
  }
  return _sql;
}

async function getTrxDetailItem(data = Object) {
  let _sql = `SELECT * FROM pos_trx_detail AS a
    LEFT JOIN mst_item_variant AS b ON a.mst_item_variant_id  = b.mst_item_variant_id 
    WHERE 1+1=2 `;
  if (data.hasOwnProperty("pos_trx_ref_id")) {
    _sql += ` AND a.pos_trx_ref_id = '${data.pos_trx_ref_id}'`;
  }
  if (data.hasOwnProperty("mst_item_variant_id") && data.mst_item_variant_id) {
    _sql += ` AND a.mst_item_variant_id = '${data.mst_item_variant_id}'`;
  }
  if (data.hasOwnProperty("barcode") && data.barcode) {
    _sql += ` AND b.barcode = '${data.barcode}'`;
  }
  let _data = await exec_query(_sql);
  return _data;
}

async function getReceive(data = Object, onlyQuery = false) {
  let _sql = `SELECT 
  MAX(a.pos_receive_id) as pos_receive_id,
  MAX(a.created_at) as created_at,
  MAX(a.created_by) as created_by,
  MAX(c.mst_item_id) as mst_item_id,
  MAX(c.mst_item_name) as mst_item_name,
  MAX(d.mst_supplier_id) as mst_supplier_id,
  MAX(d.mst_supplier_name) as mst_supplier_name,
  SUM(b.qty) as qty,
  MAX(a.status) as status,
  STRING_AGG(b.batch_no,',') AS batch
  FROM pos_receive AS a
  LEFT JOIN pos_receive_detail as b on a.pos_receive_id = b.pos_receive_id
  LEFT JOIN mst_item AS c ON b.mst_item_id = c.mst_item_id
  LEFT JOIN mst_supplier AS d ON a.mst_supplier_id = d.mst_supplier_id
  WHERE 1+1=2 `;
  if (data.hasOwnProperty("pos_receive_id")) {
    _sql += ` AND a.pos_receive_id = '${data.pos_receive_id}'`;
  }
  if (data.hasOwnProperty("batch_no")) {
    _sql += ` AND b.batch_no = '${data.batch_no}'`;
  }
  if (data.hasOwnProperty("mst_item_id") && data.mst_item_id) {
    _sql += ` AND b.mst_item_id = '${data.mst_item_id}'`;
  }
  if (data.hasOwnProperty("barcode") && data.barcode) {
    _sql += ` AND c.barcode = '${data.barcode}'`;
  }
  _sql += ` GROUP BY a.pos_receive_id ;`;
  if (onlyQuery) {
    return _sql;
  }
  let _data = await exec_query(_sql);
  return _data;
}

async function getDetailReceive(data = Object) {
  let _sql = `SELECT * 
  FROM pos_receive_detail AS a 
  LEFT JOIN mst_item AS b ON a.mst_item_id = b.mst_item_id
  WHERE 1+1=2 `;
  if (data.hasOwnProperty("pos_receive_id")) {
    _sql += ` AND a.pos_receive_id = '${data.pos_receive_id}'`;
  }
  if (data.hasOwnProperty("batch_no")) {
    _sql += ` AND a.batch_no = '${data.batch_no}'`;
  }
  if (data.hasOwnProperty("mst_item_id")) {
    _sql += ` AND b.mst_item_id = '${data.mst_item_id}'`;
  }
  _sql += ` ORDER BY a.mst_item_id ASC`;
  let _data = await exec_query(_sql);
  return _data;
}

async function getPosConfig() {
  let _sql = `SELECT * FROM pos_config LIMIT 1 `;
  let _data = await exec_query(_sql);
  return _data.data[0];
}

module.exports = {
  getReceive,
  getDetailReceive,
  getItem,
  getStockItem,
  proccessToInbound,
  proccessToStock,
  getTrxDetailItem,
  getCashier,
  getSale,
  getReturn,
  getSaleByCashier,
  getDiscount,
  getCustomer,
  getPosConfig,
};
