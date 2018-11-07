const rdf = require('@rdfjs/data-model')
const rdfExt = require('rdf-ext')
const SparqlStore = require('rdf-store-sparql')
const SimpleRDF = require('simplerdf-core')

// TODO: DNS for permits.integ.ld.admin.ch does not resolve yet
// an entry in /etc/hosts is currently needed:
// 159.100.247.144 permits.integ.ld.admin.ch

const store = new SparqlStore('http://permits.integ.ld.admin.ch/query')
const query = `DESCRIBE <http://example.org/bewilligung/1>`
// TODO const query = `DESCRIBE <http://permits.ld.admin.ch/bewilligung/1>`

const context = {
    'kontaktEmail': 'http://schema.example.org/kontaktEmail'
}

const stream = store.construct(query)

const dataset = rdfExt.dataset()
dataset.import(stream).then(() => {
    
    // console.log(dataset.toString())
    // console.log('--------------------------------------')

    const permits = dataset.match(
        null,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('http://schema.example.org/Bewilligung')
    )

    permits.forEach(p => {
        const iri = p.subject.value

        const permit = SimpleRDF(context, iri, dataset)
        console.log(`Contact E-Mail: ${permit.kontaktEmail}`)
    })    

})

