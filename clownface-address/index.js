const clownface = require('../../rdf-ext.clownface')
const namespace = require('../../rdfjs.namespace')
const initSampleDataset = require('./sample-dataset')
const assert = require('assert');

const schema = namespace('http://schema.org/')

class Person {
    constructor (dataset, fullDataset) {
      this.dataset = dataset
      this.fullDataset = fullDataset
    }

    // usage of assert() is only meant as an example. instead of just failing, validation-results should be returned in a proper datastructure
    validate() {
        assert(this._name().term)
        assert(this._address('billing-address').term)
        this.billingAddress.validate()
    }

    _name() {
        return this.dataset.out(schema.name)
    }

    _address(contactType) {
        return this.dataset.out(schema.address)
                           .has(schema.contactType, contactType)
    }

    get name() {
        return this._name().value
    }

    // this example assumes that 'jobTitle' is not always translated to all languages. user can specify his priorities and gets a 'best-match'
    getJobTitle(languagePriorities) {
        for (var i = 0; i < languagePriorities.length; i++) {
            var match = this.dataset
                .out(schema.jobTitle)
                .terms.find(t => t.language == languagePriorities[i])
            
            if (match) return match.value
        }
    }

    get billingAddress() {
        const adr = this._address('billing-address')
        if (!!adr.term) {
            return new Address(adr)
        } else {
            return undefined
        }
    }

    get shippingAddress() {
        const adr = this._address('shipping-address')
        if (!!adr.term) {
            return new Address(adr)
        } else {
            return undefined
        }
    }

    // remove the triples of the shipping-address and the link person->shipping-address
    removeShippingAddress() {
        const shippingAddress = this._address('shipping-address')        
        this.fullDataset.removeMatches(shippingAddress.term, null, null, null)
        shippingAddress.deleteIn(schema.address)
    }
}

class Address {
    constructor (dataset) {
      this.dataset = dataset
    }

    // usage of assert() is only meant as an example. instead of just failing, validation-results should be returned in a proper datastructure
    validate() {
        assert(this._streetAddress().term)
    }

    _streetAddress() {
        return this.dataset.out(schema.streetAddress)
    }

    get streetAddress() {
        return this._streetAddress().value
    }

    set streetAddress(newStreetAddress) {
        this._streetAddress().term.value = newStreetAddress
    }
}

 
initSampleDataset().then(dataset => {
    const ds = clownface.dataset(dataset)

    const p = new Person(ds.node('Jane Doe').in(schema.name), dataset)
    p.validate()

    console.log(`client name:                 ${p.name}`)
    console.log(`billing-street-adress:       ${p.billingAddress.streetAddress}`)
    console.log(`old shipping-street-adress:  ${p.shippingAddress.streetAddress}`)

    p.shippingAddress.streetAddress = 'foobar avenue 42'
    console.log(`new shipping-street-adress:  ${p.shippingAddress.streetAddress}`)
    p.validate()

    p.removeShippingAddress()
    console.log(`new shipping-adress:         ${p.shippingAddress}`)
    p.validate()

    console.log('--------------------')
    console.log(dataset.toString())
    console.log('--------------------')

    console.log(p.getJobTitle(['it','en']))
    console.log(p.getJobTitle(['de','en']))
    console.log(p.getJobTitle(['fr','en']))   // without 'french' value in the data, we get the 'english' value
})