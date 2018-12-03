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

const query = `BASE <https://permits.zazukoians.org/>
PREFIX schema: <https://schema.org/>
PREFIX bdb: <https://permits.ld.admin.ch/schema/>
CONSTRUCT {  
  ?permit a schema:GovernmentPermit .
  ?permit bdb:permitLevel ?permitLevel .
  ?permit schema:permitAudience ?permitAudience .
  ?permit bdb:status ?status .
  ?permit schema:contactPoint ?contactPoint .
  ?permit bdb:legalFoundation ?legalFoundation .
  ?permit schema:dateModified ?dateModified .
  ?permit schema:description ?description .
  ?permit schema:name ?name .
  ?permit schema:url ?url .
  ?permit bdb:agency ?agency .
  
  ?agency ?ap ?ao .
}
WHERE {          
GRAPH <https://linked.opendata.swiss/graph/seco/permits> {
  ?permit bdb:permitLevel ?permitLevel .  
  OPTIONAL { ?permit schema:permitAudience ?permitAudience }
  OPTIONAL { ?permit bdb:status ?status }  
  OPTIONAL { ?permit schema:contactPoint ?contactPoint }
  OPTIONAL { ?permit bdb:legalFoundation ?legalFoundation }
  OPTIONAL { ?permit schema:dateModified ?dateModified }
  OPTIONAL { ?permit schema:description ?description }
  OPTIONAL { ?permit schema:name ?name }      	
  OPTIONAL { ?permit schema:url ?url }
  
  OPTIONAL {
    ?permit bdb:agency ?agency .
    ?agency ?ap ?ao .
  }
  
  {
    SELECT DISTINCT ?permit WHERE {
      VALUES ?permitLevel {
        <permitlevels/BUND>
        <permitlevels/BUND_EXEC_KANTON>
        <permitlevels/GEMEINDE>
      }
      VALUES ?permitAudience {
        <permitaudiences/BETRIEB>
        <permitaudiences/PERSON>
        <permitaudiences/EVENT>
      }
      ?permit bdb:permitLevel ?permitLevel ;
              schema:permitAudience ?permitAudience .
      ?permit ?p ?text .
      (?text ?score) <tag:stardog:api:property:textMatch> 'hund*' .
    } LIMIT 20  
  }
}
}
`

const context = {
    'dateModified': 'https://schema.org/dateModified',
    'agency': 'https://permits.ld.admin.ch/schema/agency',
}

const stream = store.construct(query)

const dataset = rdfExt.dataset()
dataset.import(stream).then(() => {
    
    console.log(dataset.toString())
    console.log('=========================================')

    const permits = dataset.match(
        null,
        rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        rdf.namedNode('https://schema.org/GovernmentPermit')
    )

    permits.forEach(p => {
        const langPrios = ['fr', 'de']   // languagePriorities for selecting best matches in multilingual content
        
        const iri = p.subject.value

        const permit = SimpleRDF(context, iri, dataset)
        
        let status = objVal(dataset.match(p.subject, rdf.namedNode('https://permits.ld.admin.ch/schema/status'), null, null).toArray().shift())
        let permitLevel = objVal(dataset.match(p.subject, rdf.namedNode('https://permits.ld.admin.ch/schema/permitLevel'), null, null).toArray().shift())
        let permitAudience = objVal(dataset.match(p.subject, rdf.namedNode('https://schema.org/permitAudience'), null, null).toArray().shift())
        
        const name = objVal(findQuadByLanguage(dataset, p.subject, rdf.namedNode('https://schema.org/name'), langPrios))
        const description = objVal(findQuadByLanguage(dataset, p.subject, rdf.namedNode('https://schema.org/description'), langPrios))
        const url = objVal(findQuadByLanguage(dataset, p.subject, rdf.namedNode('https://schema.org/url'), langPrios))
        const legalFoundation = objVal(findQuadByLanguage(dataset, p.subject, rdf.namedNode('https://permits.ld.admin.ch/schema/legalFoundation'), langPrios))

        console.log(`iri:            ${iri}`)
        console.log(`status:         ${status}`)
        console.log(`permitLevel:    ${permitLevel}`)
        console.log(`permitAudience: ${permitAudience}`)

        console.log(`name:           ${name}`)
        console.log(`description:    ${description}`)
        console.log(`url:            ${url}`)
        console.log(`legalFound.:    ${legalFoundation}`)
        console.log(`dateModified:   ${permit.dateModified}`)

        if (!! permit.agency) {
            let agencyAsNamedNode = permit.agency._core.iri
            const agencyName = objVal(findQuadByLanguage(dataset, agencyAsNamedNode, rdf.namedNode('https://schema.org/name'), langPrios))
            const agencyAltName = objVal(findQuadByLanguage(dataset, agencyAsNamedNode, rdf.namedNode('https://schema.org/alternateName'), langPrios))
            console.log(`agency-name:    ${agencyName}`)
            console.log(`agency-altname: ${agencyAltName}`)
        }

        console.log('----------------------------------------------')

    })    

})
