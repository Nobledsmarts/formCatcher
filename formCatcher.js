/*
* FormCatcher.js
* (c) Richard Franklin C
*  october - 2020
*/
class FormCatcher{
    constructor(rules){
        this.rules = rules || {};
        this.punct = [
            '!', '#', '$', '%', '&', '*', '-', '_', '+', '=', '|', ':', '.',
        ]
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
        let errorsObj = [];
        let method = isHasError ? 'some' : 'forEach';
        let hasError = formKeys[method]((key, idx) => {
            let checks = (this.rules[group][key]).split("|");
            errorsObj[key] = [];
           return checks[method]((rule) => {
                if(rule == 'required' && !formValues[idx].trim()){
                    if(this.rules[group + '_errors'][key]){
                        errorsObj[key].push(this.rules[group + '_errors'][key][rule]); 
                        errors.push(this.rules[group + '_errors'][key][rule]); 
                    }
                    if( isHasError ) return !formValues[idx].trim();
                }
                else if((rule == 'decimal' || rule.startsWith('alpha')) && formValues[idx].trim()){
                    let regexStr = "";
                    if(rule == 'alpha'){
                        regexStr = "^([a-z])+$";
                    } else if(rule == 'alpha_space'){
                        regexStr = "^([a-z\s])+$";
                    } else if(rule == 'alpha_dash'){
                        regexStr = "^([a-z-_])+$";
                    } else if(rule == 'alpha_numeric'){
                        regexStr = "^([a-z0-9])+$";
                    }
                    else if(rule == 'alpha_numeric_space'){
                        regexStr = "^([a-z0-9\s])+$";
                    }
                    else if(rule == 'alpha_numeric_punct'){
                        regexStr = "^([a-z0-9\s" + this.punct.join('') + "])+$";
                    } 
                    else if(rule == 'decimal'){
                        regexStr = "^([0-9+-])+$";
                    } 
                    let regex = new RegExp(regexStr, 'ig');
                    let condition = !(regex.test(formValues[idx]));
                    if(this.rules[group + '_errors'][key]){
                        if(condition){
                            errorsObj[key].push(this.rules[group + '_errors'][key][rule]); 
                            errors.push(this.rules[group + '_errors'][key][rule]); 
                        }
                    }
                   if( isHasError ) return condition;
                }
                else if(/in_list\[(.+?)\]/ig.test(rule) && formValues[idx].trim()){
                    let regexMch = (/(in_list)\[(.+?)\]/ig.exec(rule));
                    let ruleLabel = regexMch[1];
                    let list = regexMch[2].split(',').map((el) => el.trim());
                    let condition = !list.includes(formValues[idx]);
                    if(this.rules[group + '_errors'][key]){
                        if(condition) {
                            errorsObj[key].push(this.rules[group + '_errors'][key][ruleLabel]);
                            errors.push(this.rules[group + '_errors'][key][ruleLabel]);
                        }
                    }
                    if( isHasError ) return condition;
                }
                else if(rule.split('[')[0].endsWith('length') && formValues[idx].trim()){
                    let regexStr = '';
                    if(/min_length\[\d+\]/ig.test(rule)){
                        regexStr = /(min_length)\[(\d+)\]/;
                    } else if(/max_length\[\d+\]/ig.test(rule)){
                        regexStr = /(max_length)\[(\d+)\]/;
                    }
                    else if(/exact_length\[\d+\]/ig.test(rule)){
                        regexStr = /(exact_length)\[(\d+)\]/;
                    }
                    let regex = new RegExp(regexStr, 'ig');
                    let regexMch = (regex.exec(rule));
                    let ruleLabel = regexMch[1];
                    let len = +regexMch[2];
                    let condition;
                    if(this.rules[group + '_errors'][key]){
                        if(ruleLabel == 'min_length'){
                            condition = !(formValues[idx].length >= len);
                        } else if(ruleLabel == 'max_length'){
                            condition = formValues[idx].length < len;
                        }else if(ruleLabel == 'exact_length'){
                            condition = formValues[idx].length !== len;
                        }
                        if( condition ) {
                            errorsObj[key].push(this.rules[group + '_errors'][key][ruleLabel]);
                            errors.push(this.rules[group + '_errors'][key][ruleLabel]);
                        }
                    }
                    if( isHasError ) return condition;
                }
                else if(/(differs|match)\[(.+?)\]$/ig.test(rule) && formValues[idx].trim()){
                    let regexMch = (/(.+?)\[(.+?)\]/.exec(rule));
                    let ruleLabel = regexMch[1];
                    let field = regexMch[2];
                    let condition = ruleLabel == 'match' ? formData.get(field) !== formData.get(key) : formData.get(field) == formData.get(key)
                    if(this.rules[group + '_errors'][key]){
                        if(condition){
                            errorsObj[key].push(this.rules[group + '_errors'][key][ruleLabel]);
                            errors.push(this.rules[group + '_errors'][key][ruleLabel]);
                        }
                    }
                    if( isHasError ) return condition;
                }
                else if(rule.startsWith('less_than') && formValues[idx].trim()){
                    let regexMch = (/(.+?)\[(.+?)\]/.exec(rule));
                    let ruleLabel = regexMch[1];
                    let field = regexMch[2];
                    let condition;
                    if(ruleLabel == 'less_than'){
                        condition = +formData.get(key) >= +field;
                    } else if(ruleLabel == 'less_than_equal_to'){
                        condition = +formData.get(key) > +field;
                    }
                    condition = (JSON.parse(JSON.stringify(+formData.get(key))) == null ? true : condition);
                    if(this.rules[group + '_errors'][key]){
                        if(condition){
                            errorsObj[key].push(this.rules[group + '_errors'][key][ruleLabel]);
                            errors.push(this.rules[group + '_errors'][key][ruleLabel]);
                        }
                    }
                    if( isHasError ) return condition;  
                }
                else if(rule == 'valid_email'){
                    let regex = (/^[a-y-0-9_]+@[a-y-0-9_]+\.[a-z]{2,}$/);
                    if(this.rules[group + '_errors'][key]){
                        if( !regex.test(formValues[idx]) ){
                            errorsObj[key].push(this.rules[group + '_errors'][key]['valid_email']);
                            errors.push(this.rules[group + '_errors'][key]['valid_email']);
                        }
                    }
                    if( isHasError ) return !regex.test(formValues[idx]);
                }
            });
        });
        if( isHasError ) return {hasError, errors, errorsObj};
        return type ? (type == 'obj' ? errorsObj : errors) : errors;
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
}
