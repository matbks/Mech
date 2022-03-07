/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comfiori/z_mecanica_vehicle/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
