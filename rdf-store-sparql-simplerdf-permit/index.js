const rdf = require('@rdfjs/data-model')
const rdfExt = require('rdf-ext')
const SparqlStore = require('rdf-store-sparql')
const SimpleRDF = require('simplerdf-core')


function findQuadByLanguage (dataset, subject, predicate, languages, graph) {
    languages = Array.isArray(languages) ? languages : []
  
    if (!languages.includes('')) {
      languages.push('')
    }
  
    let selected = dataset.match(subject, predicate, null, graph).filter((quad) => {
      return languages.includes(quad.object.language)
    }).toArray().sort((a, b) => {
      return languages.indexOf(a.object.language) - languages.indexOf(b.object.language)
    })
  
    return selected.shift()
}

const store = new SparqlStore('https://permits.zazukoians.org/query')

const query = `DESCRIBE <https://permits.zazukoians.org/permits/1>`

const context = {
    'dateModified': 'http://schema.org/dateModified',
}

const stream = store.construct(query)

const dataset = rdfExt.dataset()
dataset.import(stream).then(() => {
    
    console.log(dataset.toString())
    console.log('=========================================')

    const permits = dataset.match(
        null,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('http://schema.org/GovernmentPermit')
    )

    permits.forEach(p => {
        const langPrios = ['fr', 'de']   // languagePriorities for selecting best matches in multilingual content
        
        const iri = p.subject.value

        const permit = SimpleRDF(context, iri, dataset)
        
        let status = dataset.match(p.subject, rdf.namedNode('http://permits.ld.admin.ch/ns#status'), null, null).toArray().shift().object.value
        let permitLevel = dataset.match(p.subject, rdf.namedNode('http://permits.ld.admin.ch/ns#permitLevel'), null, null).toArray().shift().object.value
        let permitAudience = dataset.match(p.subject, rdf.namedNode('http://schema.org/permitAudience'), null, null).toArray().shift().object.value
        
        const name = findQuadByLanguage(dataset, p.subject, rdf.namedNode('http://schema.org/name'), langPrios).object.value
        const description = findQuadByLanguage(dataset, p.subject, rdf.namedNode('http://schema.org/description'), langPrios).object.value
        const url = findQuadByLanguage(dataset, p.subject, rdf.namedNode('http://schema.org/url'), langPrios).object.value        
        const legalFoundation = findQuadByLanguage(dataset, p.subject, rdf.namedNode('http://permits.ld.admin.ch/ns#legalFoundation'), langPrios).object.value

        console.log(`iri:            ${iri}`)
        console.log(`status:         ${status}`)
        console.log(`permitLevel:    ${permitLevel}`)
        console.log(`permitAudience: ${permitAudience}`)

        console.log(`\nname:         ${name}`)
        console.log(`description:  ${description}`)
        console.log(`url:          ${url}`)
        console.log(`legalFound.:  ${legalFoundation}`)
        console.log(`dateModified: ${permit.dateModified}`)

    })    

})
