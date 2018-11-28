const rdf = require('@rdfjs/data-model')
const rdfExt = require('rdf-ext')
const SparqlStore = require('rdf-store-sparql')

/*
stardog query test queries/insert.rq 
curl -i --data-urlencode query@queries/update.rq http://admin:admin@localhost:5820/test/update
*/

const store = new SparqlStore('http://admin:admin@localhost:5820/test/query', { updateUrl: 'http://admin:admin@localhost:5820/test/update'})

const query = `PREFIX ex: <http://schema.example.org/>
PREFIX gont: <https://gont.ch/>
PREFIX schema: <http://schema.org/>

DELETE { ?t schema:name ?name . }
INSERT { ?t schema:name 'T-1' }
WHERE
{
    ?t gont:canton <http://classifications.data.admin.ch/canton/BE> .
    ?t schema:name ?name .
}`

const event = store.update(query)
rdfExt.waitFor(event).catch((err) => {
    console.error(err)
})
