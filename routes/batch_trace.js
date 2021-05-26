'use strict'

const valhallaCfg = require('../valhalla.json')
const Valhalla = require('/usr/local/src/valhalla/lib')(JSON.stringify(valhallaCfg))
const valhalla = new Valhalla(JSON.stringify(valhallaCfg))

function traceRoute(request) {
  return new Promise((resolve, reject) => {
    valhalla.traceRoute(request, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(JSON.parse(result))
    })
  })
}

function traceAttributes(request) {
  return new Promise((resolve, reject) => {
    valhalla.traceAttributes(request, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(JSON.parse(result))
    })
  })
}

module.exports = async function (fastify, opts) {

  fastify.post('/batch_trace', async function (request, reply) {

    // Should take an array of Valhalla requests

    // Validation
    if (!request.body.shapes || request.body.shapes.length < 1) {
      reply.status(400).send({success: false, msg: 'Missing shapes'})
      return
    }

    // First run each Valhalla /trace_route
    const traces = []
    const errors = []

    for (let shape of request.body.shapes) {

      const traceRouteRequest = JSON.stringify({
        shape,
        // search_radius: 10,
        // gps_accuracy: 10,
        // use_bus: 0.5,
        // use_rail: 0.5,
        shape_match: 'map_snap',
        costing: 'auto'
      })

      try {

        const trace = await traceRoute(traceRouteRequest)

        if (trace.trip) {
          const encoded_polyline = trace.trip.legs[0].shape

          const traceAttrRequest = JSON.stringify({
            encoded_polyline,
            shape_match: 'edge_walk',
            costing: 'auto',
            action: 'include'
          })

          const attributes = await traceAttributes(traceAttrRequest)
          traces.push({
            route: trace,
            attributes
          })
        }

      } catch (err) {
        errors.push(err)
      }

    }

    return {success: true, traces, errors}
  })
}
