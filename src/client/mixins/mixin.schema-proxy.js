import { createQuerablePromise } from '../utils'

let schemaProxyMixin = {
  data () {
    return {
      schema: null
    }
  },
  methods: {
    getSchema () {
      return this.schema
    },
    getSchemaId () {
      return this.schema ? this.schema.$id : ''
    },
    getSchemaName () {
      let schemaName = this.service
      schemaName += this.id ? '.update' : '.create'
      if (this.perspective) {
        schemaName += ('-' + this.perspective)
      }
      return schemaName
    },
    loadSchema () {
      // Create a new mixin promise if required
      // In the JSON schema file we use a $id like 'http:/www.kalisio.xyz/schemas/schema-name#'
      const schemaName = this.getSchemaName()
      const schemaChanged = schemaName && !this.getSchemaId().includes(schemaName)
      if (!this.schemaPromise || schemaChanged) {
        // We need to load the schema now
        let loader = this.$store.get('loadSchema')
        this.schemaPromise = createQuerablePromise(loader(schemaName)
        .then(schema => this.schema = schema))
      }
      return this.schemaPromise
    }
  }
}

export default schemaProxyMixin
