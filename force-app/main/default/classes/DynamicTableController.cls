public with sharing class DynamicTableController {
    /**
     * Queries records from the given object using LIKE operator for each field and value pair.
     * @param objectName The API name of the object to query.
     * @param fieldApiNames List of field API names to include in the SELECT clause.
     * @param likeFilters Map of field API name to value for LIKE filtering.
     * @return List of SObjects matching the criteria.
     */
    @AuraEnabled
    public static List<SObject> queryWithLike(String objectName, List<String> fieldApiNames, Map<String, String> likeFilters) {
        if (String.isBlank(objectName) || fieldApiNames == null || fieldApiNames.isEmpty()) {
            return new List<SObject>();
        }
        String soql = 'SELECT ' + String.join(fieldApiNames, ', ')
            + ' FROM ' + objectName;
        List<String> whereClauses = new List<String>();
        for (String field : likeFilters.keySet()) {
            String value = likeFilters.get(field);
            if (!String.isBlank(value)) {
                whereClauses.add(field + ' LIKE ' + '\'%'+String.escapeSingleQuotes(value)+'%\'');
            }
        }
        if (!whereClauses.isEmpty()) {
            soql += ' WHERE ' + String.join(whereClauses, ' AND ');
        }
        return Database.query(soql);
    }

    /**
     * Returns a map of field API name to field label for a given object.
     * @param objectName The API name of the object.
     * @return Map of field API name to field label.
     */
    @AuraEnabled
    public static Map<String, String> getFieldApiNameToLabel(String objectName) {
        Map<String, String> result = new Map<String, String>();
        if (String.isBlank(objectName)) {
            return result;
        }
        Schema.SObjectType objType = Schema.getGlobalDescribe().get(objectName);
        if (objType == null) {
            return result;
        }
        Map<String, Schema.SObjectField> fields = objType.getDescribe().fields.getMap();
        for (String apiName : fields.keySet()) {
            result.put(apiName, fields.get(apiName).getDescribe().getLabel());
        }
        return result;
    }
    /**
     * Returns a map of all object API names to their labels.
     * @return Map of object API name to object label.
     */
    @AuraEnabled
    public static Map<String, String> getObjectApiNameToLabel() {
        Map<String, String> result = new Map<String, String>();
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        for (String apiName : gd.keySet()) {
            result.put(apiName, gd.get(apiName).getDescribe().getLabel());
        }
        return result;
    }
}