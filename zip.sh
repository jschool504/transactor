#!/bin/sh

# run tests and expect them to pass before we build
npm test
if [ $? -eq 1 ]; then
    exit
fi

rm transactor.zip

zip -R transactor "*"
