sap.ui.define([
	"./BaseController",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/Device",
  ],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (BaseController, Fragment, MessageToast, MessageBox, Device) {
	  "use strict";

	  return BaseController.extend("sap.ui.demo.masterdetail.controller.Master", {
		onInit: function () {
  
  
		},

		onSelectionChange : function (oEvent) {
			var oList = oEvent.getSource(),
				bSelected = oEvent.getParameter("selected");

			// skip navigation when deselecting an item in multi selection mode
			if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
				// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
				this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
			}
		},

		_showDetail : function (oItem) {
			var bReplace = !Device.system.phone;
			// set the layout property of FCL control to show two columns
			this.getModel("appView").setProperty("/layout", "TwoColumnsBeginExpanded");
			this.getRouter().navTo("object", {
				objectId : oItem.getBindingContext().getProperty("Id")
			}, bReplace);
		},
  
  
		onCreate: function () {
		  this.gbEditing = false;
		  var oView = this.getView();
		  if (!this.byId("openDialog")) {
			Fragment.load({
			  id: oView.getId(),
			  name: "sap.ui.demo.masterdetail.view.Register",
			  controller: this,
			}).then(function (oDialog) {
			  oView.addDependent(oDialog);
			  oDialog.open();
			});
		  } else {
			this.byId("openDialog").open();
		  }
		},
  
		handleSaveBtnPress: function (oEvent) {
		  var oModelCustomer = this.getView().getModel("Order");
		  var oModel = this.getView().getModel();
  
		  if (!this.gbEditing) {
			oModel.create("/OrdersSet", oModelCustomer.getData(), {
			  success: function (oData, oResponse) {
				if (oResponse.statusCode == "201") {
				  var msg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("created");
				  MessageBox.success(msg);
				  this.clearModel(oModelCustomer);
				  this.handleCancelBtnPress();
				}
			  }.bind(this),
  
			  error: function (oError) {
				var oSapMessage = JSON.parse(oError.responseText);
				var msg = oSapMessage.error.message.value;
				MessageBox.error(msg);
			  },
			});
		  } else {
			var oCurrentCustomer = oModelCustomer.getData();
			var sUpdate = oModel.createKey("/OrdersSet", {
			  Id: oCurrentCustomer.Id,
			});
  
			oModel.update(sUpdate, oCurrentCustomer, {
			  method: "PUT",
			  success: function (data, oResponse) {
				var msg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("updated");
				MessageBox.success(msg);
				this.clearModel(oModelCustomer);
				this.handleCancelBtnPress();
				oModel.refresh();
			  }.bind(this),
  
			  error: function (oError) {
				var oSapMessage = JSON.parse(oError.responseText);
				var msg = oSapMessage.error.message.value;
				MessageBox.error(msg);
			  }.bind(this),
  
			});
		  }
		},
  
		onEdit() {

			var oSmartTable = this.getView().byId("smartTable").getTable();
	
			if (oSmartTable._aSelectedPaths.length > 1) { MessageBox.error( this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("multipleRegisterNotAllowed") ); }
	
			else if (oSmartTable._aSelectedPaths.length < 1) { MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("nullRegisterNotAllowed") ); }
	
			else {
			  var SelectedItem = oSmartTable.getModel().getProperty(oSmartTable._aSelectedPaths.toString());
			  var oView = this.getView();
			  var modelCustomer = oView.getModel("Order");
			  modelCustomer.setData(SelectedItem);
			  if (!this.byId("openDialog")) {
				Fragment.load({
				  id: oView.getId(),
				  name: "sap.ui.demo.masterdetail.view.Register",
				  controller: this,
				}).then(function (oDialog) {
				  oView.addDependent(oDialog);
				  oDialog.open();
				});
			  } else {
				this.byId("openDialog").open();
			  }
			  this.gbEditing = true;
			}
		  },
	
  
		onDelete(oEvent) {
		  
		  var oSmartTable = this.getView().byId("smartTable").getTable();
  
		  if (oSmartTable._aSelectedPaths.length > 1) { MessageBox.error( this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("multipleRegisterNotAllowed") ); }
  
		  else if (oSmartTable._aSelectedPaths.length < 1) { MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("nullRegisterNotAllowed") ); }
  
		  else {
		  MessageBox.confirm(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("deleteConfirmation"), {
			actions: [
			  MessageBox.Action.YES,
			  MessageBox.Action.NO,
			],
			onClose: function (oAction) {
			  if (oAction === "NO") {
				this.handleCancelBtnPress();
			  }
  
			  else {
				var oModel = this.getView().getModel();
				var oSmartTable = this.getView().byId("smartTable").getTable();
				var oSelectedItems = oSmartTable._aSelectedPaths;
  
				for (var Selecteditem in oSelectedItems) {
				  oModel.remove(oSelectedItems[Selecteditem], {
					success: function (oData, oResponse) {
					  if (oResponse.statusCode == "204") {
						var msg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("deleted");
						MessageBox.success(msg);
						
					  }
					 }.bind(this),
					error: function (oError) {
					  var oSapMessage = JSON.parse(oError.responseText);
					  var msg = oSapMessage.error.message.value;
					  MessageBox.error(msg);
					},
				  });
				}
			  }
			}.bind(this),
		  });
		  //oSelectionTable.removeSelections();
		}
	  },
  
		handleCancelBtnPress: function () {
		  this.byId("openDialog").close();
		  var modelCustomer = this.getView().getModel("Order");
		  this.clearModel(modelCustomer);
		},
  
		clearModel: function (oModel) {
		  oModel.setData({
			Id: "",
			Plateid: "",
			Customerid: "",
			Type: "",
		  });
		},
	  });
	});
  