<template>
  <div class="col">
     <!--
     Close action
    -->
    <div v-if="closable" class="row justify-end">
      <q-btn id="left-panel-close" flat color="secondary" @click="$emit('side-nav-toggled')">
        <q-icon name="chevron_left" />
      </q-btn>
    </div>
    <!--
      Banner
     -->
    <div v-if="banner != ''" class="row justify-center items-center banner-container">
      <img class="banner-image" :src="banner">
    </div>
    <!-- 
      Components
     -->
    <div class="row justify-start">
      <template v-for="component in components">
        <component class="col-12" :key="component.name" :is="component.renderer" :name="component.name" />
      </template>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { QBtn, QIcon } from 'quasar'

export default {
  name: 'k-side-nav',
  components: {
    QBtn,
    QIcon
  },
  provide () {
    return {
      sideNav: this
    }
  },
  inject: ['layout'],
  props: {
    closable: {
      type: Boolean,
      required: true
    }
  },
  data () {
    return {
      banner: '',
      components: []
    }
  },
  methods: {
    navigate (route) {
      this.layout.hideCurrentSide(() => this.$router.push(route))
    }
  },
  created () {
    this.banner = this.$load(this.$config('sideNav.banner', 'kalisio-banner.png'), 'asset')
    // Setup the components structure
    // We build an array of components using the SideNav properties
    // A component is defined with
    //   - the renderer: the Vue component to be used for the rendering
    //   - the name: the key to retrieve the configuration
    let content = this.$config('sideNav.components', {})
    Object.entries(content).forEach(element => {
      // Setup the component
      let component = {}
      component.name = element[0]
      component.renderer = _.kebabCase(_.last(_.split(element[1], '/')))
      // Load the renderer
      if (!this.$options.components[component.key]) {
        this.$options.components[component.renderer] = this.$load(element[1])
      }
      // Add the component to the components array
      this.components.push(component)
    })
  }
}
</script>

<style>
  .banner-container {
    padding-top: 1rem;
    padding-bottom: 0.5rem;
  }
  .banner-image {
    max-width: 300px;
    max-height: 100px;
    width: auto;
    height: auto;
  }
</style>