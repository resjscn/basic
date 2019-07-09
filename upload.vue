<template>
    <div class="upload">
        <el-upload :class="{'hide':imgLength >= limit}" :disabled="disabled" :multiple="multiple" :action="action"
            :limit="limit" :list-type="listType" :show-file-list="showFileList" :before-upload="beforeAvatarUpload"
            :on-success="handleSuccess" :file-list="fileList" :on-preview="handlePictureCardPreview" :on-change="handlePictureChange"
            :on-exceed="handleExceed" name="imgUpload" :on-remove="handleRemove">
            <div slot="trigger">
                <slot><i class="el-icon-plus"></i></slot>
            </div>
        </el-upload>
        <el-dialog width="800px" :visible.sync="dialogVisible" append-to-body>
            <iframe v-if="isVideo" :src="dialogImageUrl" width="100%" height="500px" frameborder="0"></iframe>
            <img v-else class="dialogImage" :src="dialogImageUrl">
        </el-dialog>
        <!-- 视频预览 -->
        <img v-if="!start&&isVideo&&show" :src="previewURL" alt="" class="preview">
    </div>
</template>

<script>
import { URL } from 'url';
import { setTimeout } from 'timers';
export default {
    data() {
        return {
            start: true,
            dialogImageUrl: '',
            dialogVisible: false,
            fileList: [],
            propList: [],
            imgLength: 0,
            loading: false,
            disabled: false,
            previewURL: '',//视频预览链接
            isVideo: true,
            show: false
        }
    },
    props: {
        value: {
            // type: Array,
            default: []
        },
        multiple: {
            type: Boolean,
            default: false
        },
        one: {
            type: Boolean,
            default: false
        },
        showFileList: {
            type: Boolean,
            default: true
        },
        string: {
            type: Boolean,
            default: false
        },
        limit: {
            type: Number,
            default: 20
        },
        size: {
            type: Number,
            default: 1
        },
        action: {
            type: String,
            default: process.env.VUE_APP_FILE_BASE_URL || ''
        },
        listType: {
            type: String,
            default: 'picture-card'
        },
        target: {
            type: String,
            default: process.env.VUE_APP_FILEAPI_BASE_URL || ''
        },
        fileType: {
            type: String,
            default: '(jpg|JPG|gif|GIF)$'
        }
    },
    methods: {
        handlePictureChange(file, fileList) {
            this.imgLength = fileList.length
            if (this.one && !this.loading) {
                this.$emit('change', true)
                this.disabled = true
            }
        },
        handleSuccess(file, fileInfo) {
            this.start = false;
            this.show = true;
            if (this.one) {
                this.propList = []
                this.$emit('change', false)
                this.disabled = false
                this.loading = true
                setTimeout(() => {
                    this.loading = false
                }, 300)
            }
            let item = this.target + file.imgPath;
            if (this.showFileList && this.listType == 'text') {
                item = { url: this.target + file.imgPath, name: fileInfo.name }
            }
            this.propList.push(item)
            let val = [...this.propList]
            if (this.string) {
                val = val.join(',')
            }
            fileInfo['type'] = this.isVideo ? 2 : 1;
            this.$emit('input', val)
            this.$emit('infoChange', fileInfo)
        },
        handleRemove(file, fileList) {
            this.show = false;
            let url = file.response ? file.response.imgPath : file.url;
            setTimeout(() => {
                this.imgLength = this.propList.length
            }, 500)
            this.propList.forEach((item, index) => {
                if (this.showFileList && this.listType == 'text') {
                    item = item.url
                }
                if (item.indexOf(url) > -1) {
                    this.propList.splice(index, 1)
                    let val = [...this.propList]
                    if (this.string) {
                        val = val.join(',')
                    }
                    this.$emit('input', val)
                }
            })
        },
        handleExceed(a, b) {
            this.$message.error('最多上传' + this.limit + '个文件')
        },
        handlePictureCardPreview(file) {
            if (this.showFileList && this.listType == 'picture-card') {
                this.dialogImageUrl = file.url
                this.dialogVisible = true
            }
        },
        beforeAvatarUpload(file) {

            const isLtSize = file.size / 1024 / 1024 < this.size;
            const fileTypeArr = file.name.split('.');
            const fileType = fileTypeArr[fileTypeArr.length - 1];
            let Tip = this.fileType.replace(/\|/g, ',').match(/[a-zA-Z]+/ig).toString();
            const isLtType = new RegExp(this.fileType).test(fileType)
            if (!isLtSize) {
                this.$message.error('文件大小不能超过 ' + this.size + 'M')
            }
            if (!isLtType) {
                this.$message.error('上传文件格式不正确,请上传' + Tip + '格式的文件')
            }
            if (/video/.test(file.type)) {
                //预览视频
                var canvas = document.createElement("canvas");
                var oVideo = document.createElement("video");
                oVideo.src = window.URL.createObjectURL(file);
                oVideo.addEventListener('loadeddata', () => {
                    canvas.width = oVideo.videoWidth * 0.8;
                    canvas.height = oVideo.videoHeight * 0.8;
                    canvas.getContext('2d').drawImage(oVideo, 0, 0, canvas.width, canvas.height);
                    this.previewURL = canvas.toDataURL("image/png");
                    this.isVideo = true
                })
            } else {
                this.isVideo = false
            }
            return isLtSize && isLtType
        }
    },
    watch: {
        value: function (list) {
            if (!list.length) {
                this.propList = []
                this.fileList = []
                this.imgLength = 0
            }
            if (this.start) {
                this.start = false
                if (this.string) {
                    list = list.split(',')
                }
                this.propList = [...list]
                this.imgLength = list.length
                list.forEach((url, index) => {
                    let item = { url }
                    if (this.showFileList && this.listType == 'text') {
                        item = { url: url.url, name: url.name }
                    }
                    this.fileList.push(item)
                })
            }
        },
    }
}
</script>

<style scoped>
.hide >>> .el-upload {
    display: none;
}
.dialogImage {
    display: block;
    max-width: 100%;
    max-height: 500px;
    margin: auto;
}
</style>
<style scoped>
.upload {
    position: relative;
}
.preview {
    width: 148px;
    height: 148px;
    position: absolute;
    left: 0;
    top: 0;
    z-index: 8;
}
.upload >>> .el-upload-list__item-actions {
    z-index: 9;
}
</style>
