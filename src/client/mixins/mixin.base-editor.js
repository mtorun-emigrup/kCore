import logger from 'loglevel'

export default function baseEditorMixin (formRefs) {
  return {
    props: {
      clearButton: {
        type: String,
        default: ''
      },
      resetButton: {
        type: String,
        default: ''
      }
    },
    data () {
      return {
        applyButton: ''
      }
    },
    methods: {
      fillEditor () {
        // Iterate over forms
        formRefs.forEach(name => {
          let form = this.$refs[name]
          if (form.loadRefs().isFulfilled()) {
            if (this.getObject()) {
              if (this.perspective !== '') {
                form.fill(this.getObject()[this.perspective])
              } else {
                form.fill(this.getObject())
              }
            }
          } else {
            logger.warn(`Trying to fill the editor with a non-ready form named ${form}`)
          }
        })
        // Update button accordingly
        if (this.id) {
          this.applyButton = 'Update'
        } else {
          this.applyButton = 'Create'
        }
      },
      clear () {
        // Iterate over forms
        formRefs.forEach(name => {
          let form = this.$refs[name]
          if (form.loadRefs().isFulfilled()) {
            form.clear()
          } else {
            logger.warn(`Trying to clear the editor with a non-ready form named ${form}`)
          }
        })
      },
      reset () {
        // Iterate over forms
        formRefs.forEach(name => {
          let form = this.$refs[name]
          if (form.loadRefs().isFulfilled()) {
            form.reset()
          } else {
            logger.warn(`Trying to reset the editor with a non-ready form named ${form}`)
          }
        })
      },
      apply (event, done) {
        // Iterate over forms for validation
        let isValid = true
        let object = {}
        formRefs.forEach(name => {
          let form = this.$refs[name]
          if (form.loadRefs().isFulfilled()) {
            let result = form.validate()
            if (!result.isValid) {
              isValid = false
            } else {
              Object.assign(object, result.values)
            }
          } else {
            logger.warn(`Trying to apply the editor with a non-ready form named ${form}`)
            isValid = false
          }
        })

        if (!isValid) {
          if (done) done()
          return
        }

        if (this.getService()) {
          // Small helper to avoid repeating too much similar code
          let onServiceResponse = response => {
            this.$emit('applied', response)
            if (done) done()
          }

          // Update the item
          if (this.applyButton === 'Update') {
            // Edtng mode => patch the item
            if (this.perspective !== '') {
              let data = {}
              data[this.perspective] = object
              this.servicePatch(this.id, data, { query: { $select: [this.perspective] } })
              .then(onServiceResponse)
            } else {
              this.servicePatch(this.id, object)
              .then(onServiceResponse)
            }
          } else if (this.applyButton === 'Create') {
            // Creation mode => create the item
            this.serviceCreate(object)
            .then(onServiceResponse)
          } else {
            logger.warn('Invalid editor mode')
            if (done) done()
          }
        }
      },
      refresh () {
        // When the service is available
        this.loadService()
        // We can then load the schema/object and local refs in parallel
        return Promise.all([
          this.loadSchema(),
          this.loadObject(),
          this.loadRefs()
        ])
        // We finally build the forms then fill it
        .then(_ => Promise.all(formRefs.map(name => this.$refs[name].build())))
        .then(_ => this.fillEditor())
      }
    }
  }
}
