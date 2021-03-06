let baseContextMixin = {
  props: {
    contextId: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      contextLoaded: false
    }
  },
  watch: {
    '$route' (to, from) {
      // React to route changes but reusing the same component as this one is generic
      this.refreshContext()
    }
  },
  methods: {
    clearActions () {
      this.$store.patch('appBar', { toolbar: [], menu: [] })
    },
    // This method could be overriden in app for more dynamic behaviour
    // default one is to get the action list from the configuration and set it in app bar
    getActionsForContext (context) {
      let actions = this.$config('context.actions', [])
      // Update actions to use current context
      actions.forEach(action => { action.route.params['contextId'] = this.contextId })
      return actions
    },
    clearContext () {
      this.clearActions()
      this.$store.set('context', null)
      this.contextLoaded = false
    },
    setContext (context) {
      // Set context in store so that contextual services are aware of it
      this.$store.set('context', context)
      this.contextLoaded = true
      let actions = this.getActionsForContext(context)
      this.$store.patch('appBar', { toolbar: actions.toolbar, menu: actions.menu })
    },
    refreshContext () {
      if (this.contextId) {
        // Context already set ?
        const context = this.$store.get('context')
        if (context && context._id === this.contextId) return
        // Otherwise clear so that underlying components will be destroyed
        this.clearContext()
        // Then update the context
        this.service.get(this.contextId)
        .then(context => this.setContext(context))
      } else {
        this.clearContext()
      }
    }
  },
  created () {
    this.service = this.$api.getService(this.$config('context.service'))
    // Register the context
    this.refreshContext()
  },
  beforeDestroy () {
    this.clearContext()
  }
}

export default baseContextMixin
