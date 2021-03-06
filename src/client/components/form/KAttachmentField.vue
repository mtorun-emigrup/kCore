<template>
  <q-field
    :icon="icon"
    :label="label"
    :helper="helper"
    :error-label="errorLabel"
    :label-width="labelWidth"
    :error="hasError"
    :disabled="disabled"
  >
    <q-chip  v-for="file in files" :key="file.name" color="primary" @close="onFileRemoved(file)" closable>
      {{fileName(file)}}
    </q-chip>
    <q-icon :id="properties.name + '-field'" v-show="files.length < maxFiles" name="fa-cloud-upload fa-2x" @click="onUpload"/>
    <k-uploader 
      ref="uploader" 
      :contextId="contextId" 
      :objectId="objectId" 
      :resource="resource" 
      @file-selection-changed="updateFiles" 
      :options="properties.field"/>
  </q-field>
</template>

<script>
import _ from 'lodash'
import { QIcon, QChip, QField } from 'quasar'
import { KUploader } from '../input'
import mixins from '../../mixins'

export default {
  name: 'k-attachment-field',
  components: {
    QIcon,
    QChip,
    QField,
    KUploader
  },
  mixins: [mixins.baseField],
  data () {
    return {
      files: [],
      resource: ''
    }
  },
  computed: {
    maxFiles () {
      return (this.isMultiple() ? _.get(this.properties, 'maxFiles', 5) : 1)
    }
  },
  methods: {
    isMultiple () {
      return _.get(this.properties, 'field.multiple', false)
    },
    autoProcessQueue () {
      return _.get(this.properties, 'field.autoProcessQueue', true)
    },
    storageService () {
      return this.$api.getService(this.properties.service || 'storage', this.contextId)
    },
    resourcesService () {
      return _.get(this.properties, 'field.resourcesService', '')
    },
    isObject () {
      return (this.properties.type === 'object')
    },
    emptyModel () {
      if (this.isMultiple()) return []
      return (this.isObject() ? {} : '')
    },
    fill (value) {
      this.model = value
      if (this.isMultiple()) {
        this.files = this.model
      } else {
        this.files = (!_.isEmpty(this.model) ? [this.model] : [])
      }
    },
    async apply (object, field) {
      // If not processing uploads on-the-fly upload when the form is being submitted on update
      // because we already have the object ID that might be required to build the storage path
      if (!this.autoProcessQueue()) {
        if (this.getMode() === 'update') {
          await this.$refs.uploader.processQueue()
          // On create we don't send the attachment field because it will be
          // updated as a postprocess when attaching files on the newly created object
          _.set(object, field, this.value())
        }
      } else {
        _.set(object, field, this.value())
      }
    },
    async submitted (object, field) {
      // If not processing uploads on-the-fly upload when the form has being submitted on create
      // so that we have the object ID available that might be required to build the storage path
      if (!this.autoProcessQueue()) {
        // On update the files are created before updating the object
        if (this.getMode() === 'create') {
          this.resource = object._id
          // We need to force a refresh so that the prop is correctly updated by Vuejs in child component
          await this.$nextTick()
          await this.$refs.uploader.processQueue()
        }
      }
    },
    updateFiles (files) {
      this.files = files
      this.updateModel()
    },
    updateModel () {
      // filter rendering properties only
      if (this.isMultiple()) {
        this.model = this.files
      } else {
        this.model = (this.files.length > 0 ? this.files[0] : {})
      }
      this.onChanged()
    },
    fileName (file) {
      return (file.name
              ? file.name
              : (file._id ? file._id : file))
    },
    onUpload () {
      // When not processing uploads on-the-fly we start from a fresh state
      // otherwise we would have to keep thumbnails, etc. in-memory
      if (!this.autoProcessQueue()) {
        this.updateFiles([])
      }
      this.$refs.uploader.open(this.files)
    },
    onFileRemoved (oldFile) {
      // When processing uploads on-the-fly we need to remove from server
      if (this.autoProcessQueue()) {
        const storage = this.storageService()
        storage.remove(oldFile._id, {
          query: { resource: this.objectId, resourcesService: this.resourcesService() }
        })
        // Thumbnail as well
        storage.remove(oldFile._id + '.thumbnail')
      }
      this.updateFiles(this.files.filter(file => file.name !== oldFile.name))
    }
  }
}
</script>
