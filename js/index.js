(function() {
    var data2 = {
        type: 'search',
        s: '��ɫ',
        search_type: 1006
    }
    var data = {
        keywords: 'beautifulNow',
        limit: 1
    };
    var dataList = []; //�����б�
    var oAudio = null; //��ǰ�Ľڵ�
    var ap = null; //���ֲ�����
    var ctrl = null; //canvas������
    var oCtx = new AudioContext(); //��ǰ��������
    var timer = null; //��ʱ��
    var oCanvas = document.getElementById('canvas');
    // var oDownloadMusic = document.getElementById('downloadMusic');
    var oLoadingBox = document.getElementById('loadingBox');
    ap = new APlayer({
        container: document.getElementById('player'),
        mini: false,
        autoplay: false,
        theme: '#FADFA3',
        loop: 'all',
        order: 'random',
        preload: 'auto',
        volume: 0.7,
        mutex: true,
        listFolded: false,
        listMaxHeight: 90,
        lrcType: 1, //1��string,3��lrc�ļ�
        audio: []
    });
    ap.on('canplay', function() {
        ctrl.play()
    });
    // ap.on('ended', function () {
    //     ctrl.resume()
    // });


    axios.interceptors.request.use(function(config) {
        // �ڷ�������֮ǰ����
        oLoadingBox.style.display = 'block';
        return config
    }, function(error) {
        // ������
        return Promise.reject(error)
    })

    axios.interceptors.response.use(function(response) {
        // �ڷ�������֮����
        oLoadingBox.style.display = 'none';
        return response
    }, function(error) {
        // ������
        return Promise.reject(error)
    });

    //���û�����С�ķ���
    function resetCanvas() {
        oCanvas.width = window.innerWidth;
        oCanvas.height = window.innerHeight;
        oLoadingBox.width = window.innerWidth;
        oLoadingBox.height = window.height;
    }
    //������
    function play(eAudio, eCanvas, count) {
        //��ȡ��
        var audioScr = oCtx.createMediaElementSource(eAudio);
        var analyser = oCtx.createAnalyser();
        var _color_stop = 0.3;
        audioScr.connect(analyser);
        analyser.connect(oCtx.destination);
        var vocieHeight = new Uint8Array(analyser.frequencyBinCount);

        function bg3() {
            var r = Math.floor(Math.random() * 256);
            var g = Math.floor(Math.random() * 256);
            var b = Math.floor(Math.random() * 256);
            return "rgb(" + r + ',' + g + ',' + b + ")";
        }
        //��Ⱦ
        function draw() {
            var aCtx = eCanvas.getContext('2d');
            var oW = eCanvas.width;
            var oH = eCanvas.height;
            var color = aCtx.createLinearGradient(oW / 6, oH / 2, oH * 1.5, oW / 2);
            color.addColorStop(0, '#c7c7f4');
            color.addColorStop(0.5, '#b37bf9');
            color.addColorStop(1, '#c9c2e1');

            var step = ~~(vocieHeight.length / count);
            analyser.getByteFrequencyData(vocieHeight);
            aCtx.clearRect(0, 0, oW, oH);
            for (var i = 0; i < count; i++) {
                var audioHeight = (vocieHeight[step * i] * 1.5) - 5;
                // color.addColorStop(0, bg3());
                // color.addColorStop(0.3, bg3());
                // color.addColorStop(0.6, bg3());
                // color.addColorStop(1, bg3());
                aCtx.fillStyle = color;
                aCtx.fillRect(20 + (i * 20), oH, 8, -audioHeight)
            }
        }

        return {
            play() {
                timer = setInterval(draw, 1000 / 60)
            },
            resume() {
                oCtx.resume()
                clearInterval(timer)
            }
        }
    }
    //��Ƶ��ʼ��
    function init(newData, i, reset) {
        var lyric, picLink;
        var data = newData.result.songs[i];
        new Promise(resolve => {
            //��ȡ���
            axios.get('http://www.resjs.cn:3001/lyric', { params: { id: data.id }, })
                .then(res => {
                    lyric = res.data.lrc.lyric || '';
                    resolve()
                })
        }).then(res => {
            // ͨ�������ȡ����ͼ
            return new Promise(resolve => {
                axios.get('http://resjs.cn:3001/song/detail', { params: { ids: data.id }, })
                    .then(res => {
                        picLink = res.data.songs[0].al.picUrl || 'https://p1.music.126.net/ze_ggtReuHBLF2o-wUolFw==/109951163221161145.jpg';
                        resolve()
                    })
            })
        }).then(res => {
            ap.list.add({
                name: data.name,
                artist: data.artists[0].name,
                url: reset ? data.url : 'http://www.resjs.cn:3000/song/media/outer/url?id=' + data.id,
                cover: picLink,
                lrc: lyric,
                theme: '#ebd0c2'
            })
            ap.list.switch(ap.list.audios.length - 1)
            ap.audio.crossOrigin = 'anonymous';
            ctrl ? ctrl.resume() : ctrl = play(ap.audio, oCanvas, 180);
            ap.play()
        })
    }

    //����
    function search() {
        var musicName = document.getElementById('musicName').value;
        if (!musicName) return;
        getMusic({ keywords: musicName, limit: 10 }, function(data) {
            dataList = data;
            render()
        })
    }
    //��Ⱦ�������ĸ����б�
    function render() {
        var str = '';
        dataList.result.songs.forEach(v => {
            str += `<li class="item"><a href="javascript:void(0)">${v.name}-${v.artists[0].name}</a></li>`
        })
        document.getElementsByClassName('selBox')[0].innerHTML = str;
        document.getElementsByClassName('selBox')[0].style.display = 'block';
        let item = document.querySelectorAll('.item');
        item.forEach((v, i) => {
            v.onclick = function() {
                init(dataList, i)
            }
        })
    }
    //��ȡ����
    function getMusic(newData, callBack) {
        var resetData = (newData ? newData : data);
        // https://api.imjad.cn/cloudmusic/?type=search&&s=%E7%BB%BF%E8%89%B2&&search_type=1006
        axios.get('http://www.resjs.cn:3001/search', { params: resetData, })
            .then(res => {
                var data = res.data;
                //��ȡ���
                resetData.limit == 1 && init(data, 0);
                callBack && callBack(data)
            })
    }

    //��ʼ����Ĭ�ϲ���data������
    getMusic()
        //���û�����С
    resetCanvas()
        //���ƻ�����С
    window.onresize = function() {
        resetCanvas()
    }
    document.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        document.getElementsByClassName('selBox')[0].style.display = 'none';
        return false;
    }
    document.getElementById('search').onclick = search;
    //������קʱ��
    document.ondragover = function(e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        //��ק
    document.ondrop = function(e) {
        var dt = e.dataTransfer;
        var file = dt.files[0];
        var name = file.name;
        const blob = new Blob([file]);
        const url = URL.createObjectURL(blob);
        var data = [{
            name,
            singer: '',
            url,
            // cover: data.picLink,
            picLink: '',
            lyric: ''
        }];
        init(data, 0, true)
        e.preventDefault();
        e.stopPropagation();
        return false;
    }


    var e = "%c";
    var r = "color:#495A80;text-shadow: 0 1px 0 #ccc,0 2px 0 #c9c9c9,0 1px 0 #bbb;font-size:20px";
    console.info(e + "Design by Resolve (www.resjs.cn v1.0.0)\r\n", r);
}())