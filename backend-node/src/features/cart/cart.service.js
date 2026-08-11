'use strict';
/**
 * Cart service — get/create cart, compute totals, manage items.
 * Equivalent to Python's app/services/cart_service.py
 */
const { getDb } = require('../../db/connection');
const { getVisitCharge, getTaxPct } = require('../../utils/helpers');
const { nowUtc, newId, clean } = require('../../utils/security');

function httpError(status, msg) {
  const e = new Error(msg);
  e.statusCode = status;
  return e;
}

async function getOrCreateCart(userId) {
  const db = getDb();
  let cart = await db.collection('carts').findOne({ service_needer_id: userId });
  if (!cart) {
    cart = { id: newId(), service_needer_id: userId, created_at: nowUtc() };
    await db.collection('carts').insertOne(cart);
  }
  return cart;
}

async function cartResponse(userId) {
  const db = getDb();
  const cart = await getOrCreateCart(userId);
  const items = await db.collection('cart_items').find({ cart_id: cart.id }).toArray();

  const detailed = [];
  let subtotal = 0;

  for (const it of items) {
    const svc = await db.collection('services').findOne({ id: it.service_id });
    if (!svc) continue;
    const line = parseFloat(it.price_snapshot) * parseInt(it.quantity, 10);
    subtotal += line;
    detailed.push({
      ...clean({ ...it }),
      service: clean({ ...svc }),
      line_total: line,
    });
  }

  const visitCharge = await getVisitCharge();
  const taxPct = await getTaxPct();
  const tax = Math.round(subtotal * taxPct * 100) / 100;
  const total = Math.round((subtotal + (subtotal > 0 ? visitCharge : 0) + tax) * 100) / 100;

  return {
    cart_id: cart.id,
    items: detailed,
    subtotal: Math.round(subtotal * 100) / 100,
    visit_charge: subtotal > 0 ? visitCharge : 0,
    tax,
    total,
  };
}

async function addCartItemService(body, user) {
  const db = getDb();
  const svc = await db.collection('services').findOne({ id: body.service_id, is_active: true });
  if (!svc) throw httpError(404, 'Service not found');

  const cart = await getOrCreateCart(user.id);
  const existing = await db.collection('cart_items').findOne({ cart_id: cart.id, service_id: body.service_id });

  if (existing) {
    await db.collection('cart_items').updateOne(
      { id: existing.id },
      { $set: { quantity: existing.quantity + body.quantity } },
    );
  } else {
    await db.collection('cart_items').insertOne({
      id: newId(),
      cart_id: cart.id,
      service_id: body.service_id,
      quantity: body.quantity,
      price_snapshot: parseFloat(svc.price),
      created_at: nowUtc(),
    });
  }
  return cartResponse(user.id);
}

async function updateCartItemService(itemId, body, user) {
  const db = getDb();
  const cart = await getOrCreateCart(user.id);
  if (body.quantity <= 0) {
    await db.collection('cart_items').deleteOne({ id: itemId, cart_id: cart.id });
  } else {
    await db.collection('cart_items').updateOne(
      { id: itemId, cart_id: cart.id },
      { $set: { quantity: body.quantity } },
    );
  }
  return cartResponse(user.id);
}

async function deleteCartItemService(itemId, user) {
  const db = getDb();
  const cart = await getOrCreateCart(user.id);
  await db.collection('cart_items').deleteOne({ id: itemId, cart_id: cart.id });
  return cartResponse(user.id);
}

module.exports = {
  getOrCreateCart,
  cartResponse,
  addCartItemService,
  updateCartItemService,
  deleteCartItemService,
};
