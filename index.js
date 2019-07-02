import sendCodeComponent from './sendCode.vue'
const sendCode = {
    install:function(Vue){
        Vue.component('sendCode',sendCodeComponent)
    }
}
export default sendCode