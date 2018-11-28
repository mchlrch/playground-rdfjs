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

function objVal(any) {
    return ((any || {}).object || {}).value
}

const store = new SparqlStore('https://permits.zazukoians.org/query')

// const query = `DESCRIBE <https://permits.zazukoians.org/permits/1>`
const query = `BASE <http://permits.integ.ld.admin.ch/>
PREFIX schema: <http://schema.org/>
PREFIX bdb: <http://permits.ld.admin.ch/ns#>
CONSTRUCT {
  ?permit ?pp ?po  
}
WHERE {
  ?permit ?pp ?po .
  {
    SELECT DISTINCT ?permit WHERE {
      VALUES ?permitLevel {
        <permitLevels/BUND>
        <permitLevels/BUND_EXEC_KANTON>
        <permitLevels/GEMEINDE>
      }
      VALUES ?permitAudience {
        <permitAudiences/BETRIEB>
        <permitAudiences/PERSON>
        <permitAudiences/EVENT>
      }
      ?permit bdb:permitLevel ?permitLevel ;
              schema:permitAudience ?permitAudience .
      ?permit ?p ?text .
      (?text ?score) <tag:stardog:api:property:textMatch> 'hund*' .
    } LIMIT 20  
  }
}
`

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
        
        let status = objVal(dataset.match(p.subject, rdf.namedNode('http://permits.ld.admin.ch/ns#status'), null, null).toArray().shift())
        let permitLevel = objVal(dataset.match(p.subject, rdf.namedNode('http://permits.ld.admin.ch/ns#permitLevel'), null, null).toArray().shift())
        let permitAudience = objVal(dataset.match(p.subject, rdf.namedNode('http://schema.org/permitAudience'), null, null).toArray().shift())
        
        const name = objVal(findQuadByLanguage(dataset, p.subject, rdf.namedNode('http://schema.org/name'), langPrios))
        const description = objVal(findQuadByLanguage(dataset, p.subject, rdf.namedNode('http://schema.org/description'), langPrios))
        const url = objVal(findQuadByLanguage(dataset, p.subject, rdf.namedNode('http://schema.org/url'), langPrios))
        const legalFoundation = objVal(findQuadByLanguage(dataset, p.subject, rdf.namedNode('http://permits.ld.admin.ch/ns#legalFoundation'), langPrios))

        console.log(`iri:            ${iri}`)
        console.log(`status:         ${status}`)
        console.log(`permitLevel:    ${permitLevel}`)
        console.log(`permitAudience: ${permitAudience}`)

        console.log(`name:           ${name}`)
        console.log(`description:    ${description}`)
        console.log(`url:            ${url}`)
        console.log(`legalFound.:    ${legalFoundation}`)
        console.log(`dateModified:   ${permit.dateModified}`)
        console.log('----------------------------------------------')

    })    

})
