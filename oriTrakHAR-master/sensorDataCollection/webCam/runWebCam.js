const child_process = require('child_process')

function genDateFormatString () {
  var d = new Date()
  return ('00' + (d.getMonth() + 1)).slice(-2) + '-' +
    ('00' + d.getDate()).slice(-2) + '-' +
    d.getFullYear() + '_' +
    ('00' + d.getHours()).slice(-2) + '-' +
    ('00' + d.getMinutes()).slice(-2) + '-' +
    ('00' + d.getSeconds()).slice(-2)
}

const cmd = `ffmpeg -f video4linux2 -input_format mjpeg -r 25  -i /dev/video0 \
-vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf: \
text='%{localtime\\:%T}': fontcolor=white@0.8: x=7: y=210" -vcodec libx264 \
-preset veryfast -f mp4 -pix_fmt yuv420p -y "${genDateFormatString()}_groundTruth.mp4"`

child_process.exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.log(err)
  }
  if (stdout) {
    console.log(stdout)
  }
  if (stderr) {
    console.log(stderr)
  }
})
