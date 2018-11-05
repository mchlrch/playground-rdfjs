const ParserN3 = require('@rdfjs/parser-n3')
const Readable = require('stream').Readable
const rdf = require('../../rdf-ext.rdf-ext')

function init () {
    const input = new Readable({
    read: () => {
        input.push(`
        PREFIX s: <http://schema.org/>

        [] a s:Person ;
            s:jobTitle "Professor"@en ;
            s:jobTitle "Professorin"@de ;
            s:jobTitle "Professoressa"@it ;

            s:name "Jane Doe" ;
            s:telephone "(425) 123-4567" ;
            s:url <http://www.janedoe.com> ;
            
            s:address [
                a s:PostalAddress ;
                s:streetAddress "Treasure Island Drive 123" ;
                s:postalCode "1234" ;
                s:addressLocality "Hometown" ;
                s:contactType "billing-address" ;
            ] ;

            s:address [
                a s:PostalAddress ;
                s:streetAddress "Central Blvd 42" ;
                s:postalCode "9876" ;
                s:addressLocality "Worktown" ;
                s:contactType "shipping-address" ;
            ] .
        `)
        input.push(null)
    }
    })

    const parserN3 = new ParserN3()
    const output = parserN3.import(input)

    // output.on('data', quad => {
    //   console.log(`quad: ${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
    // })

    // output.on('prefix', (prefix, ns) => {
    //   console.log(`prefix: ${prefix} ${ns.value}`)
    // })

    return rdf.dataset().import(output)
}

module.exports = init