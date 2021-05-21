'use strict'

const axios = require('axios')

const VALHALLA_API = 'http://localhost:8002'
// TODO: Implement defaults
// const DEFAULT_TRACE_OPTIONS = {
//   search_radius: 10,
//   gps_accuracy: 10,
//   use_bus: 0.5,
//   use_rail: 0.5,
//   shape_match: 'map_snap',
//   costing: 'auto'
// }
// const DEFAULT_ATTR_OPTIONS = {
//   shape_match: 'edge_walk',
//   costing: 'auto',
//   action: 'include'
// }

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
    const metadata = []

    for (let shape of request.body.shapes) {

      try {

        const matched = await axios.post(`${VALHALLA_API}/trace_route`, {
          shape,
          search_radius: 10,
          gps_accuracy: 10,
          use_bus: 0.5,
          use_rail: 0.5,
          shape_match: 'map_snap',
          costing: 'auto'
        });


        if (matched.data && matched.data.trip) {

          traces.push(matched.data)

          const encodedPolyline = matched.data.trip.legs[0].shape;

          // Then run each Valhalla /trace_attributes
          const meta = await axios.post(`${VALHALLA_API}/trace_attributes`, {
            encoded_polyline: encodedPolyline,
            shape_match: 'edge_walk',
            costing: 'auto',
            action: 'include'
          });

          if (meta.data) {
            metadata.push(meta.data)
          }

        }

      } catch (err) {
        // TODO: Handle errors
      }

    }

    console.log(traces)
    console.log(metadata)

    return {success: true, traces, metadata}
  })
}
