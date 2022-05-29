const path = require('path')
const orders = require(path.resolve('src/data/orders-data'))
const nextId = require('../utils/nextId')

// MiddleWare
function orderExists(req, res, next) {
  const orderId = req.params.orderId
  const foundOrder = orders.find((order) => order.id === orderId)

  if (foundOrder) {
    res.locals.orderId = orderId
    res.locals.order = foundOrder
    return next()
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  })
}

function isValid(req, _, next) {
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body

  if (!deliverTo) {
    return next({
      status: 400,
      message: 'Order must include a deliverTo',
    })
  } else if (!mobileNumber) {
    return next({
      status: 400,
      message: 'Order must include a mobileNumber',
    })
  } else if (!dishes) {
    return next({
      status: 400,
      message: 'Order must include a dish',
    })
  } else if (!dishes.length || !Array.isArray(dishes)) {
    return next({
      status: 400,
      message: 'Order must include at least one dish',
    })
  }
  for (index in dishes) {
    const dish = dishes[index]
    const { quantity } = dish

    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      })
    }
  }
  next()
}

//
//
// Create
function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body

  const newOrder = {
    id: { nextId },
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
  }

  orders.push(newOrder)
  res.status(201).json({ data: newOrder })
}
// Read
function read(_, res) {
  res.json({ data: res.locals.order })
}

// Update
function update(req, res, next) {
  const orderId = res.locals.orderId
  const {
    data: { id, deliverTo, mobileNumber, dishes, status } = {},
  } = req.body

  if (id && orderId !== id) {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${orderId}`,
    })
  } else if (!status || status === 'invalid') {
    next({
      status: 400,
      message:
        'Order must have a status of pending, preparing, out-for-delivery, delivered',
    })
  } else if (status === 'delivered') {
    next({
      status: 400,
      message: 'A delivered order cannot be changed',
    })
  }

  const newOrder = {
    id: orderId,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
    status: status,
  }

  res.json({ data: newOrder })
}

// Delete
function destroy(req, res, next) {
  const order = res.locals.order
    const { orderId } = req.params
    const index = orders.findIndex((order) => order.id === orderId)
    if (index > -1 && order.status === 'pending') {
        orders.splice(index, 1)
    } else {
        return next({
            status: 400,
            message: 'An order cannot be deleted unless it is pending'
        })
    }
    res.sendStatus(204)
}
// List
function list(_, res) {
  res.json({ data: orders })
}

// Exports
module.exports = {
  create: [isValid, create],
  read: [orderExists, read],
  update: [orderExists, isValid, update],
  delete: [orderExists, destroy],
  list,
}