sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/Filter",
],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (Controller, Fragment, MessageToast, MessageBox, FilterOperator,Filter) {
    "use strict";

    return Controller.extend("com.fiori.zmecanicavehicle.controller.View1", {
      onInit: function () {

        this.oDataServiceUrl = "/sap/opu/odata/sap/ZP_MB_MECANICA_SRV/";
        this.ODataModel = new sap.ui.model.odata.ODataModel(
          this.oDataServiceUrl, true
        );
        sap.ui.getCore().setModel(this.ODataModel);
        
      },

      onSuggestModel: function (event) {
       var oSF = this.byId("modelSearchField").getBinding("suggestionItems");

        var sValue = event.getParameter("suggestValue"),
          aFilters = [];
          if (sValue) {
            aFilters = [
                new Filter([
                    new Filter("Model", FilterOperator.Contains, sValue)
                ], false)
            ];
        }
        
        oSF.filter(aFilters);
        oSF.attachEventOnce('dataReceived', _ => this.byId("modelSearchField").suggest());
      },

      onCreate: function () {
        this.gbEditing = false;
        var oView = this.getView();
        if (!this.byId("openDialog")) {
          Fragment.load({
            id: oView.getId(),
            name: "com.fiori.zmecanicavehicle.view.Register",
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            oDialog.open();
          });
        } else {
          this.byId("openDialog").open();
        }
      },

      _validatePlate: function () {
        var Valid = false;

        var plateValue = this.byId("plateInput").getValue();

        var regex="[A-Z]{3}[0-9][0-9A-Z][0-9]{2}"

        if ( plateValue.match(regex) ){
          Valid = true;
        }
        return Valid;
      },

      _validateCpf: function () {
        var Valid = false;

        var cpfValue = this.byId("cpfInput").getValue();

        if ( cpfValue != ""){
          Valid = true;
        }
        return Valid;
      },

      handleSaveBtnPress: function (oEvent) {

        var validPlate = this._validatePlate();
        var validCpf = this._validateCpf();

        if (validPlate && validCpf ) {
      
        var oModelVehicle = this.getView().getModel("Vehicle");
        var oModel = this.getView().getModel();

        if (!this.gbEditing) {
          oModel.create("/VehiclesSet", oModelVehicle.getData(), {
            success: function (oData, oResponse) {
              if (oResponse.statusCode == "201") {
                var msg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("created");
                MessageBox.success(msg);
                this.clearModel(oModelVehicle);
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
          var oCurrentVehicle = oModelVehicle.getData();
          var sUpdate = oModel.createKey("/VehiclesSet", {
            Plate: oCurrentVehicle.Plate,
          });

          oModel.update(sUpdate, oCurrentVehicle, {
            method: "PUT",
            success: function (data, oResponse) {
              var msg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("updated");
              MessageBox.success(msg);
              this.clearModel(oModelVehicle);
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
      }
      else if (validPlate == false && validCpf == true) {
        MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("invalidPlate"));
      }
      else if (validPlate == true && validCpf == false) {
        MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("invalidCpf"));
      }
      else
      {
        MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("invalidPlateAndCpf"));
      }
      },

      onEdit() {

        var oSmartTable = this.getView().byId("smartTable").getTable();

        if (oSmartTable._aSelectedPaths.length > 1) { MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("multipleRegisterNotAllowed")); }

        else if (oSmartTable._aSelectedPaths.length < 1) { MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("nullRegisterNotAllowed")); }

        else {
          var SelectedItem = oSmartTable.getModel().getProperty(oSmartTable._aSelectedPaths.toString());
          var oView = this.getView();
          var modelVehicle = oView.getModel("Vehicle");
          modelVehicle.setData(SelectedItem);
          if (!this.byId("openDialog")) {
            Fragment.load({
              id: oView.getId(),
              name: "com.fiori.zmecanicavehicle.view.Register",
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

        if (oSmartTable._aSelectedPaths.length > 1) { MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("multipleRegisterNotAllowed")); }

        else if (oSmartTable._aSelectedPaths.length < 1) { MessageBox.error(this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("nullRegisterNotAllowed")); }

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
                        this.handleCancelBtnPress();
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

      onSearch: function (oEvent) {
        var sInputValue = oEvent.getSource().getValue();
        this.inputId = oEvent.getSource().getId();
        var path;
        var oTableStdListTemplate;
        var oFilterTableNo;
        this.oDialog = sap.ui.xmlfragment("com.fiori.zmecanicavehicle.view.CustomerSh", this);
        path = "/ZmecshCustomerIdSet";
        oTableStdListTemplate = new sap.m.StandardListItem({ title: "{Cpf}" });// //create a filter for the binding
        oFilterTableNo = new sap.ui.model.Filter("Cpf", sap.ui.model.FilterOperator.Contains, sInputValue);
        this.oDialog.unbindAggregation("items");
        this.oDialog.bindAggregation("items", {
          path: path,
          template: oTableStdListTemplate,
          filters: [oFilterTableNo]
        }
        );// }// open value help dialog filtered by the input value
        this.oDialog.open(sInputValue);
      },

      handleTableValueHelpConfirm: function (e) {
        var s = e.getParameter("selectedItem");
        if (s) {
          this.byId(this.inputId).setValue(s.getBindingContext().getObject().Cpf);
          //this.readRefresh(e);         
        }
        this.oDialog.destroy();
      },

      handleCancelBtnPress: function () {
        this.byId("openDialog").close();
        var modelVehicle = this.getView().getModel("Vehicle");
        this.clearModel(modelVehicle);
      },

      clearModel: function (oModel) {
        oModel.setData({
          Plate: "",
          Brand: "",
          Model: "",
          Fabyear: "",
          Color: "",
          Customerid: "",
        });
      },
    });
  });
