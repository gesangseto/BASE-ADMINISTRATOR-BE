"use strict";
const response = require("../../response");
const models = require("../../models");
const { getStockItem } = require("./generate_item");
const { numberPercent } = require("../../utils");
const perf = require("execution-time")();

const cleanup = async function (req, res) {
  var data = { data: req.body };
  try {
    perf.start();
    let _query = `
    TRUNCATE pos_item_stock CASCADE;
    TRUNCATE pos_discount CASCADE;
    TRUNCATE pos_trx_detail CASCADE;
    TRUNCATE pos_trx_inbound CASCADE;
    TRUNCATE pos_receive CASCADE;
    TRUNCATE pos_receive_detail CASCADE;
    TRUNCATE pos_trx_sale CASCADE;
    TRUNCATE pos_trx_return CASCADE;
    `;
    let _res = await models.exec_query(_query);
    return response.response(_res, res);
  } catch (error) {
    data.error = true;
    data.message = `${error}`;
    return response.response(data, res);
  }
};

const calculateSale = async ({
  header = Object,
  detail = Array,
  type = "sale",
}) => {
  let body = { ...header };
  body[`pos_trx_${type}_id`] = header[`pos_trx_${type}_id`];
  body.mst_customer_id = header.mst_customer_id ?? 0;
  body.price_percentage = header.price_percentage ?? 0;
  body.ppn = header.mst_customer_ppn;
  body.is_paid = false;
  body.total_price = 0;
  body.total_discount = 0;
  body.grand_total = 0;
  let _detail_item = [];
  for (const it of detail) {
    let param = {
      mst_item_id: it.mst_item_id,
      mst_item_variant_id: it.mst_item_variant_id,
      barcode: it.barcode,
    };
    let _item = await getStockItem(param);
    _item = _item.data[0];
    if (!_item) {
      throw new Error(`Item Variant is not found!`);
    }
    it.qty = it.qty * _item.mst_item_variant_qty;
    if (_item.qty < it.qty) {
      throw new Error(`Request ${it.qty} Item Variant stock is not enough!`);
    }
    let _dt = { ...it };
    _dt.pos_trx_ref_id = body[`pos_trx_${type}_id`];
    _dt.mst_item_variant_id = _item.mst_item_variant_id;
    _dt.mst_item_id = _item.mst_item_id;
    _dt.qty = it.qty;
    _dt.capital_price = _item.price;
    _dt.price = numberPercent(_item.price, body.price_percentage);
    _dt.discount_price = numberPercent(
      _item.discount_price,
      body.price_percentage
    );
    _dt.total = _dt.qty * (_dt.price - _dt.discount_price);

    _item.qty = parseInt(_item.qty) - it.qty;
    body.total_price += it.qty * _dt.price;
    body.total_discount += it.qty * _dt.discount_price;
    body.grand_total += body.total_price - body.total_discount;
    body.grand_total = numberPercent(body.grand_total, body.ppn);
    _detail_item.push(_dt);
  }
  let _item = { ...body };
  if (type == "sale") {
    _item.sale_item = _detail_item;
  } else if (type == "return") {
    _item.return_item = _detail_item;
  }
  return _item;
};

module.exports = { calculateSale, cleanup };
