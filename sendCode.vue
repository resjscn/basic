<template>
    <el-button
        :type="type"
        :disabled="start"
        size="small"
        :class="start ? 'btn-disabled' : ''"
        >
        {{tmpStr}}
    </el-button>
</template>

<script type="text/babel">
    export default {
        name: 'yd-sendcode',
        data() {
            return {
                tmpStr: this.initStr,
                timer: null,
                start: false,
                runSecond: this.second,
                lastSecond: 0
            }
        },
        props: {
            type: {
                type: String,
                default: ''
            },
            initStr: {
                type: String,
                default: '获取验证码'
            },
            second: {
                default: 60,
                validator(val) {
                    return /^\d*$/.test(val);
                }
            },
            runStr: {
                type: String,
                default: '重新发送({%s})'
            },
            resetStr: {
                type: String,
                default: '获取验证码'
            },
            value: {
                type: Boolean,
                default: false
            },
            storageKey: {
                type: String
            }
        },
        methods: {
            run() {
                let lastSecond = this.lastSecond;
                let second = lastSecond ? lastSecond : this.runSecond;
                if (this.storageKey) {
                    const runSecond = new Date().getTime() + second * 1000;
                    window.sessionStorage.setItem(this.storageKey, runSecond);
                }
                if (!lastSecond) {
                    this.tmpStr = this.getStr(second);
                }
                this.timer = setInterval(() => {
                    second--;
                    this.tmpStr = this.getStr(second);
                    second <= 0 && this.timeout();
                }, 1000);
            },
            timeout() {
                this.tmpStr = this.resetStr;
                this.start = false;
                this.$emit('input', false);
                clearInterval(this.timer);
            },
            getStr(second) {
                return this.runStr.replace(/\{([^{]*?)%s(.*?)\}/g, second);
            }
        },
        watch: {
            value(val) {
                this.start = val;
                if (!val) {
                    clearInterval(this.timer);
                    this.tmpStr = this.initStr;
                    if (this.storageKey) {
                        window.sessionStorage.removeItem(this.storageKey);
                        this.lastSecond = 0;
                    }
                } else {
                    this.run();
                }
            }
        },
        created() {
            const lastSecond = ~~((window.sessionStorage.getItem(this.storageKey) - new Date().getTime()) / 1000);
            if (lastSecond > 0 && this.storageKey) {
                this.$emit('input', true);
                this.tmpStr = this.getStr(lastSecond);
                this.lastSecond = lastSecond;
            }
        },
        beforeDestroy() {
            !this.storageKey && this.timeout();
        }
    }
</script>