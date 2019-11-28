#  проект «Email Parser» 
###
Установить Node JS для windows: https://nodejs.org/en/.

Статья: http://prgssr.ru/development/vvedenie-v-paketnyj-menedzher-npm-dlya-nachinayushih.html.

Установить Node JS для Linux:

    Заходим на https://nodejs.org/en/;

    Копируем ссылку на исходники;
    
    https://nodejs.org/dist/v12.13.1/node-v12.13.1-x64.msi
    // wget http://nodejs.org/dist/node-v0.1.97.tar.gz;

    tar -xvf node-v0.1.97.tar.gz;

    //либо делаем так;

    git clone git://github.com/ry/node.git (если git есть);

    cd node*;

     ./configure;

    make;

    make install;

###
Установка пакетов проекта, в директории проекта: npm i -DE;

Запуск проекта: node index.js

###
В директории config/default.js  находятся настройки читаемой почты radionovAlek@yandex.ru;

В директории core/attacments  грузятся вложения писем.
