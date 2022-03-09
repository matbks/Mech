sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {
		createDeviceModel : function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},
		
		createVehiclesModel: function () {
			var oModel = new JSONModel({                
				Plate: "",
				Brand: "",
				Model: "",
				Fabyear: "",
				Color: "",
				Customerid: "",     
			});
			return oModel;
		  },
		  createCustomerModel: function () {
			var oModel = new JSONModel({
				Cpf: "",
				Name: "",
				Address: "",
				Telephone: "",
			});
			return oModel;
		  },

		  createOrderModel: function () {
			var oModel = new JSONModel({
				
				Plate: "",
			});
			return oModel;
		  }
	};
});