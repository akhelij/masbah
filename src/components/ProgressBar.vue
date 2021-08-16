<template>
  <div :class="bar">
    <div class="loader" :style="{ width: progress + '%' }">
      <div class="light"></div>
    </div>
    <div class="glow"></div>
  </div>
</template>

<script>
export default {
  computed: {
    bar () {
      return {
        'loading-container': true,
        loading: this.loading,
        visible: this.visible
      }
    },
    loading () {
      return this.$store.state.progressbar.loading
    },
    visible () {
      return this.$store.state.progressbar.visible
    },
    progress () {
      return this.$store.state.progressbar.progress
    }
  }
}
</script>

<style scoped>
.loading-container {
	 text-align: left;
	 font-size: 0;
	 position: fixed;
	 top: 0;
	 left: 0;
	 height: 5px;
	 width: 100%;
	 opacity: 0;
	 display: none;
	 z-index: 100;
	 transition: opacity 0.2s;
}
 .loading-container.visible {
	 display: block;
}
 .loading-container, .loading-container.loading {
	 opacity: 1;
}
 .loading-container .loader {
	 background: #37EDFF;
	 display: inline-block;
	 height: 100%;
	 width: 50%;
	 overflow: hidden;
	 border-radius: 0 0 5px 0;
	 transition: width 0.2s ease-out;
}
 .loading-container .loader .light {
	 float: right;
	 height: 100%;
	 width: 20%;
	 background-image: linear-gradient(to right, #37EDFF, #29ffff, #37EDFF);
	 animation: loading-animation 2s ease-in infinite;
}
 .loading-container .glow {
	 display: inline-block;
	 height: 100%;
	 width: 30px;
	 margin-left: -30px;
	 border-radius: 0 0 5px 0;
	 box-shadow: 0 0 10px #37EDFF;
}
 @keyframes loading-animation {
	 0% {
		 margin-right: 100%;
	}
	 50% {
		 margin-right: 100%;
	}
	 100% {
		 margin-right: -10%;
	}
}
 
</style>