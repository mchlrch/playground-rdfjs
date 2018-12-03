const rdf = require('@rdfjs/data-model')
const rdfExt = require('rdf-ext')
const SparqlStore = require('rdf-store-sparql')

const store = new SparqlStore('http://admin:admin@localhost:5820/bdb/query')
const query = `DESCRIBE <https://permits.zazukoians.org/permits/1>`

const dataset = rdfExt.dataset()
const stream = store.construct(query)

dataset.import(stream).then(() => {
    console.log(dataset.toString())    
})

