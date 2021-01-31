![Logo](admin/security-alert.png)
# ioBroker.security-alert

[![NPM version](http://img.shields.io/npm/v/iobroker.security-alert.svg)](https://www.npmjs.com/package/iobroker.security-alert)
[![Downloads](https://img.shields.io/npm/dm/iobroker.security-alert.svg)](https://www.npmjs.com/package/iobroker.security-alert)
![Number of Installations (latest)](http://iobroker.live/badges/security-alert-installed.svg)
![Number of Installations (stable)](http://iobroker.live/badges/security-alert-stable.svg)
[![Dependency Status](https://img.shields.io/david/Homemade-Disaster/iobroker.security-alert.svg)](https://david-dm.org/Homemade-Disaster/iobroker.security-alert)
[![Known Vulnerabilities](https://snyk.io/test/github/Homemade-Disaster/ioBroker.security-alert/badge.svg)](https://snyk.io/test/github/Homemade-Disaster/ioBroker.security-alert)

[![NPM](https://nodei.co/npm/iobroker.security-alert.png?downloads=true)](https://nodei.co/npm/iobroker.security-alert/)

**Tests:** ![Test and Release](https://github.com/Homemade-Disaster/ioBroker.security-alert/workflows/Test%20and%20Release/badge.svg)

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## security-alert adapter for ioBroker

Depending on the defined enumerations the security alert will react a status changes of different sensors. It sends notifications and activate a siren by getting the right status witch can be defined in the adapter configuration.

### Configuration


## Dependencies
The adapter is using enumerations of ioBroker. Notifications can be send using Pushover, Telegram, eMail, WhatsAPP, Alexa and AWTRIX.

## Changelog

### 0.0.2
* (ioKlausi) adapter config and general functions created

### 0.0.1
* (ioKlausi) initial release

## License
MIT License

Copyright (c) 2021 ioKlausi <nii@gmx.at>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
