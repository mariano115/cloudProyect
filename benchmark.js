const autocannon = require('autocannon');
const { PassThrough } = require('stream')

const run = (url) => {
const buf = []
const outputStream = new PassThrough()

const inst = autocannon({
    url,
    connection: 100,
    duration:20
})

autocannon.track(inst, {outputStream: outputStream})

outputStream.on('data', data => buf.push(data))
inst.on('done', function(){
    process.stdout.write(Buffer.concat(buf))
})
}
console.log('Running all benchmarks in parallel ...')

run('http://localhost:9095/info')