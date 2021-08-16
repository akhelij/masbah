<template>
  <label class="switch">
    <input type="checkbox" v-bind="{
          ...$attrs,
          onChange: (event) => $emit('update:modelValue', event.target.checked)
        }"
        :checked="modelValue"
    />
    <span class="slider round shadow-sm"></span>
  </label> 
</template>
<script>
export default {
    inheritAttrs: false,
    name:"TToggle",
    props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  }
}
</script>
<style>
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;  
  border: 1px solid #37EDFF;  
  background-color: #37EDFF;
  border-radius: 34px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #D0FBFF;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 24px;
  width: 24px;
  left: -5px;
  bottom: -3px;
  background-color: #FFF;
  -webkit-transition: .4s;
  transition: .4s;
  -webkit-box-shadow: 1px 1px 8px -4px #000000; 
  box-shadow: 1px 1px 8px -4px #000000;
  
}

input:checked + .slider {
  background-color: #37EDFF;
}

/* input:focus + .slider {
  border: 1px solid #ff4e37;
} */

input:checked + .slider:before {
  -webkit-transform: translateX(28px);
  -ms-transform: translateX(28px);
  transform: translateX(26px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>