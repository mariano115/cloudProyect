En balanceProyect ejecutar "npm install"
Copiar Config de Nginx que se encuentra dentro del proyecto

En balanceProyect ejecutar:

pm2 start index.js --name="ServerComun"  --watch -- --PORT=9090
pm2 start index.js --name="cluster" --watch -i 4 -- --PORT=9091
pm2 start index.js --name="infoFork"  --watch -- --PORT=9095        
(No lo ejecuto con -i max por que la computadora que utilizo tiene demasiados hilos para el proyecto)
(Ademas Aclaro que no utilize el Puerto numero 8081 ya que este estaba ocupado en mi computadora que uso para desarrollar
A cambio utilize la 9090 y los 4 puertos a crear para /api/randoms son el [9091,..,9094])
pm2 stop all
pm2 delete all


Para la tarea de Performance Comandos:
npm i -g artillery
npm i autocannon --save
npm i -g 0x

1)
node --prof index.js --PORT=9095
artillery quick --count 50 -n 20 http://localhost:9095/info > result_info.txt
modificar el archivo isolate a info-v8.log
node.exe --prof-process info-v8.log > result_prof-info.txt


Test de Autocannon y punto numero 3)
npm start
npm test (en otra consola)
(Adjunto Captura de pantalla Autocannon Test.jpg)
(En la carpeta 8892.0x se incluye el flamegraph.html)

Adjunto un archivo pdf con el resultado de los tests
