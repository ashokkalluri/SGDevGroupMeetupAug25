import { LightningElement, track } from 'lwc';
import getObjectApiNameToLabel from '@salesforce/apex/DynamicTableController.getObjectApiNameToLabel';
import getFieldApiNameToLabel from '@salesforce/apex/DynamicTableController.getFieldApiNameToLabel';
import queryWithLike from '@salesforce/apex/DynamicTableController.queryWithLike';

export default class ObjectPicker extends LightningElement {
    @track options = [];
    @track value = '';
    @track fieldOptions = [];
    @track selectedFields = [];
    @track filterFields = [];
    @track filters = {};
    @track results = [];

    connectedCallback() {
        this.getListOfObjects();
    }
    getListOfObjects(){
        getObjectApiNameToLabel().then(data => {
            this.options = Object.entries(data)
                .map(([apiName, label]) => ({ label, value: apiName }))
                .sort((a, b) => a.label.localeCompare(b.label));
        }).catch(error => {
            console.error('Error fetching object names:', error);
            this.options = [];
        });
    }

    handleChange(event) {
        this.value = event.detail.value;
        this.selectedFields = [];
        this.filterFields = [];
        this.filters = {};
        this.results = [];
        if(this.value) {
            getFieldApiNameToLabel({ objectName: this.value })
                .then(data => {
                    this.fieldOptions = Object.entries(data)
                        .map(([apiName, label]) => ({ label, value: apiName }))
                        .sort((a, b) => a.label.localeCompare(b.label));
                })
                .catch(error => {
                    console.error('Error fetching fields:', error);
                    this.fieldOptions = [];
                });
        } else {
            this.fieldOptions = [];
        }
    }

    handleFieldChange(event) {
        this.selectedFields = event.detail.value;
        // Set filterFields for filter table
        this.filterFields = this.fieldOptions
            .filter(opt => this.selectedFields.includes(opt.value))
            .map(opt => ({ apiName: opt.value, label: opt.label }));
        // Reset filters for new field selection
        this.filters = {};
        this.results = [];
        console.log('objectPicker.js-60==>', this.filterFields);
    }

    handleFilterInput(event) {
        const apiName = event.target.dataset.apiName;
        this.filters = { ...this.filters, [apiName]: event.target.value };
    }

    get showFilterTable() {
        return this.filterFields && this.filterFields.length > 0;
    }

    handleSearch() {
        // Prepare likeFilters map with only non-empty values
        const likeFilters = {};
        for (const field of this.filterFields) {
            const val = this.filters[field.apiName];
            if (val && val.trim() !== '') {
                likeFilters[field.apiName] = val;
            }
        }
        if (!this.value || !this.selectedFields.length) {
            return;
        }
        queryWithLike({
            objectName: this.value,
            fieldApiNames: this.selectedFields,
            likeFilters: likeFilters
        })
        .then(data => {
            this.results = data;
            console.log('objectPicker.js-91==>',JSON.stringify(this.results));
        })
        .catch(error => {
            this.results = [];
        });
    }
    
    get tableRows() {
        if (!this.results || !this.filterFields) return [];
        console.log('objectPicker.js-100==>',JSON.stringify(this.filterFields));
        console.log('objectPicker.js-101==>',JSON.stringify(this.results));
        var tableRowsData = this.results.map(row => {
            console.log('objectPicker.js-102==>',JSON.stringify(row));
            return {
                id: row.Id,
                values: this.filterFields.map(field => {
                    console.log('objectPicker.js-105==>',JSON.stringify(field));
                    console.log('objectPicker.js-106==>',JSON.stringify(row));
                    console.log('objectPicker.js-107==>',JSON.stringify(row[field.apiName]));
                    const key = Object.keys(row).find(k => k.toLowerCase() === field.apiName.toLowerCase());
                    return key ? row[key] : '';                
                })
            };
        });

        console.log('objectPicker.js-114==>', JSON.stringify(tableRowsData));

        return tableRowsData;
    }
}