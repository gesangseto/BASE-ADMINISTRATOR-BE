"use strict";
const response = require("../../response");
const models = require("../../models");
const { isDate, diffDate } = require("../../utils");
const moment = require("moment");
const { getDiscount } = require("./generate_item");
const perf = require("execution-time")();

exports.get = async function (req, res) {
  var data = { data: req.query };
  try {
    // LINE WAJIB DIBAWA
    perf.start();

    const require_data = [];
    for (const row of require_data) {
      if (!req.query[`${row}`]) {
        throw new Error(`${row} is required!`);
      }
    }
    // LINE WAJIB DIBAWA
    const check = await getDiscount(req.query);
    return response.response(check, res);
  } catch (error) {
    data.error = true;
    data.message = `${error}`;
    return response.response(data, res);
  }
};

exports.insert = async function (req, res) {
  var data = { data: req.body };
  try {
    perf.start();
    let body = req.body;
    var require_data = [
      "mst_item_variant_id",
      "pos_discount_starttime",
      "pos_discount_endtime",
    ];
    for (const row of require_data) {
      if (!body[`${row}`]) {
        throw new Error(`${row} is required!`);
      }
    }

    if (!body.hasOwnProperty("pos_discount")) {
      if (
        !body.hasOwnProperty("pos_discount_min_qty") ||
        !body.hasOwnProperty("pos_discount_free_qty")
      ) {
        throw new Error(`Discount or (Min qty and Free qty) is required!`);
      }
      throw new Error(`Discount is required!`);
    }
    body.pos_discount_starttime = isDate(body.pos_discount_starttime);
    body.pos_discount_endtime = isDate(body.pos_discount_endtime);
    if (!body.pos_discount_starttime || !body.pos_discount_endtime) {
      throw new Error(`Date is Invalid!`);
    }
    let diff = diffDate(body.pos_discount_starttime, body.pos_discount_endtime);
    if (diff <= 0) {
      throw new Error(`Date range is Invalid!`);
    }
    let check = await getDiscount({
      mst_item_variant_id: body.mst_item_variant_id,
      status: 1,
    });
    if (check.data.length == 1) {
      throw new Error(`Item Variant is already has a discount!`);
    }
    var _res = await models.insert_query({
      data: body,
      table: "pos_discount",
    });
    return response.response(_res, res);
  } catch (error) {
    data.error = true;
    data.message = `${error}`;
    return response.response(data, res);
  }
};

exports.update = async function (req, res) {
  var data = { data: req.body };
  try {
    perf.start();
    let body = req.body;
    var require_data = ["pos_discount_id", "status"];
    for (const row of require_data) {
      if (!body[`${row}`]) {
        throw new Error(`${row} is required!`);
      }
    }
    if (body.status != 0) {
      throw new Error(`Cannot set other than inactive!`);
    }
    let check = await getDiscount({
      pos_discount_id: body.pos_discount_id,
    });
    if (check.data.length == 0) {
      throw new Error(`Discount not found!`);
    }

    var _res = await models.update_query({
      data: body,
      table: "pos_discount",
      key: "pos_discount_id",
    });
    return response.response(_res, res);
  } catch (error) {
    data.error = true;
    data.message = `${error}`;
    return response.response(data, res);
  }
};

exports.delete = async function (req, res) {
  var data = { data: req.body };
  try {
    perf.start();

    const require_data = ["pos_discount_id"];
    for (const row of require_data) {
      if (!req.body[`${row}`]) {
        data.error = true;
        data.message = `${row} is required!`;
        return response.response(data, res);
      }
    }
    // LINE WAJIB DIBAWA
    var _res = await models.delete_query({
      data: req.body,
      table: "pos_discount",
      key: "pos_discount_id",
      deleted: false,
    });
    return response.response(_res, res);
  } catch (error) {
    data.error = true;
    data.message = `${error}`;
    return response.response(data, res);
  }
};
