class FormCatcher{
    constructor(rules){
        this.rules = rules || {};
        this.punct = [
            '!', '#', '$', '%', '&', '*', '-', '_', '+', '=', '|', ':', '.',
        ];
    }
    validate(group, formData){
        let hasError = this.hasError.bind(this, group, formData);
        let getErrors = this.getErrors.bind(this, group, formData);
        let getErrorsObj = this.getErrorsObj.bind(this, group, formData);
        return {
            hasError,
            getErrors,
            getErrorsObj
        }
    }
    hasError(group, formData, field){
        let pileError = this.pileError(group, formData, field, 'obj', true);
        if(field) return pileError.errorsObj[field] ? !!pileError.errorsObj[field].length : pileError.hasError;
        return pileError.hasError
    }  
    pileError(group, formData, field, type, isHasError){
        let formKeys = [...  formData.keys()];
        let formValues = [...  formData.values()];
        let errors = [];
        let errorsObj = {};
        let method = isHasError ? 'some' : 'forEach';
        let hasError = formKeys[method]((key, idx) => {
            let checks = (this.rules[group][key]).split("|");
            errorsObj[key] = [];
            return checks[method]((rule) => {
                let regexMch = (/^(.+?)(\[(.+?)\])?$/ig).exec(rule);
                let ruleLabel = regexMch[1];
                let inputValue = formValues[idx].trim();
                let hasPermitEmpty = checks.includes('permit_empty');
                let groupErrors = this.rules[group + '_errors'];
                let ruleLabels = Object.keys(this.ruleMethods());
                let obj = {regexMch, inputValue, hasPermitEmpty};
                if(ruleLabels.includes(ruleLabel)){
                    let ruleMethods = this.ruleMethods(obj);
                    let condition = !ruleMethods[ruleLabel](key, formData, checks);
                    if(groupErrors[key]){
                        if(condition){
                            if( !errorsObj[key].length ){
                                errorsObj[key].push(groupErrors[key][ruleLabel]);
                                errors.push(groupErrors[key][ruleLabel]);
                            }
                        }
                    }
                    if( isHasError ) return condition;
                } else {
                    let groupMethods = this.rules[group + '_rules'];
                    if(groupMethods && groupMethods[key]){
                        let customRules = Object.keys(groupMethods[key]);
                        if(customRules.includes(ruleLabel)){
                            let conditionObj =  groupMethods[key][ruleLabel].call(this, inputValue, formData, ruleLabel) || {};
                            let condition = !!Object.keys(conditionObj).length;
                            if( condition ){
                                if( !errorsObj[key].length ){
                                    errorsObj[key].push(conditionObj.error || groupErrors[key][ruleLabel]);
                                    errors.push(conditionObj.error || groupErrors[key][ruleLabel]);
                                }
                            }
                            if( isHasError ) return condition;
                        }
                    }
                }
            });
        });
        if( isHasError ) return {hasError, errors, errorsObj};
        return type ? (type == 'obj' ? errorsObj : errors) : errors;
    }
    ruleMethods(obj = {}){
        let [regexMch, inputValue, hasPermitEmpty] = Object.values(obj);
        let field = inputValue ? regexMch[3] : '';
        return {
            alpha : () => {
                return (/^([a-z])+$/ig.test(inputValue));
            },
            alpha_space : () => {
                return (/^([a-z\s])+$/ig.test(inputValue));
            },
            alpha_dash : () => {
                return (/^([a-z-_])+$/ig.test(inputValue));
            },
            alpha_numeric : () => {
                return (/^([a-z0-9])+$/ig.test(inputValue));
            },
            alpha_numeric_space : () => {
                return (/^([a-z0-9\s])+$/ig.test(inputValue));
            },
            alpha_numeric_punct : () => {
                return (new RegExp("^([a-z0-9\s" + this.punct.join('') + "])+$", "ig").test(inputValue));
            },
            decimal : () => {
                return (/^((\-|\+)?[0-9]\.[0-9])$/ig.test(inputValue));
            },
            numeric : () => {
                return (/^(\+|\-)?([0-9])+$/ig.test(inputValue));
            },
            is_natural : () => {
                return (/^([0-9])+$/ig.test(inputValue));
            },
            is_natural_no_zero : () => {
                return (/^([1-9][0-9]*)$/ig.test(inputValue));
            },
            min_length : () => {
               return (inputValue.length >= field);
            },
            max_length : () => {
                return inputValue.length <= field;
            },
            exact_length : () => {
                return inputValue.length === field;
            },
            valid_email : () => {
                return (/^[a-y-0-9._]+@[a-y-0-9_]+\.[a-z]{2,}$/).test(inputValue);
            },
            less_than : () => {
                return inputValue < +field;
            },
            less_than_equal_to : () => {
                return inputValue <= +field;
            },
            greater_than : () => {
                return inputValue > +field;
            },
            greater_than_equal_to : () => {
                return inputValue >= +field;
            },
            differs : (key, formData) => {
                return  formData.get(field) !== inputValue 
            },
            matches : (key, formData) => {
               return formData.get(field) === inputValue
            },
            in_list : () => {
                let list = field.split(',').map((el) => el.trim());
                return list.includes(inputValue);
            },
            required : () => {
                return hasPermitEmpty ? true : inputValue;
            },
            regex_match : () => {
                let regexHolder = field.split(',').map((e) => e.trim());
                let regexStr = regexHolder[0];
                let quantifier = regexHolder[1] || 'ig'
                return (new RegExp(regexStr, quantifier).test(inputValue));
            }
        }
    }
    getErrorsObj(group, formData, field){
        let errors = this.pileError(group, formData, field, 'obj');
        return field && errors[field] ? errors[field] : errors;
    }
    getErrors(group, formData, field){
        let errors = this.pileError(group, formData, field, 'array');
        return errors;
    }
    setRule(group, field, ruleObj){
       if ( !this.rules[group] ) this.rules[group] = {};
       if ( !this.rules[group + '_errors'] ) this.rules[group + '_errors'] = {};
       this.rules[group] = {
           [field] : ruleObj.rule,
        ...this.rules[group]
       }
       this.rules[group + '_errors'][field] = ruleObj.errors;
    }
    setRules(group, rules){
        for(let rule of rules){
            this.setRule(group, rule.field, rule);
        }
    }
    setRulesMethod(group, field, ruleObject){
        if ( !this.rules[group] ) throw Error('cant set set custom rules on ' + group + ', group doesnt exist');
        if ( !(this.rules[group + '_rules']) ) this.rules[group + '_rules'] = {};
        this.rules[group + '_rules'][field] = {
            ...ruleObject,
            ...this.rules[group + '_rules'][field]
        } 
    }
    setRulesMethods(group, customRules){
        if ( !this.rules[group] ) throw Error('cant set set custom rules on ' + group + ', group doesnt exist');
        for(let field in customRules){
            this.setRulesMethod(group, field, customRules[field])
        }
    }
}