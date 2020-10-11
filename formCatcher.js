class FormCatcher{
    constructor(rules){
        this.rules = rules || {};
        this.punct = [
            '!', '#', '$', '%', '&', '*', '-', '_', '+', '=', '|', ':', '.',
        ];
        this.ruleLabels = [
            'alpha', 'alpha_space', 'alpha_dash', 'alpha_numeric', 'alpha_numeric_space', 'alpha_numeric_punct', 'decimal', 'differs', 'exact_length', 'greater_than', 'greater_than_equal_to', 'in_list', 'matches', 'max_length', 'min_length', 'numeric', 'required', 'permit_empty', 'valid_email',
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
                let regex = /^(.+?)(\[(.+?)\])?$/ig;
                let ruleLabel = regex.exec(rule)[1];
                let inputValue = formValues[idx].trim();
                let hasPermitEmpty = checks.includes('permit_empty');
                let groupErrors = this.rules[group + '_errors'];
                if(this.ruleLabels.includes(ruleLabel)){
                    if(rule == 'required' && !inputValue && !hasPermitEmpty){
                        if(groupErrors[key]){
                            if( !errorsObj[key].length ){
                                errorsObj[key].push(groupErrors[key][rule]); 
                                errors.push(groupErrors[key][rule]);
                            }
                        }
                        if( isHasError ) return !inputValue;
                    }
                    else if((rule == 'decimal' || rule.startsWith('alpha')) && inputValue){
                        let regexStr = "";
                        if(rule == 'alpha'){
                            regexStr = "^([a-z])+$";
                        } else if(rule == 'alpha_space'){
                            regexStr = "^([a-z\s])+$";
                        } else if(rule == 'alpha_dash'){
                            regexStr = "^([a-z-_])+$";
                        } else if(rule == 'alpha_numeric'){
                            regexStr = "^([a-z0-9])+$";
                        } else if(rule == 'alpha_numeric_space'){
                            regexStr = "^([a-z0-9\s])+$";
                        } else if(rule == 'alpha_numeric_punct'){
                            regexStr = "^([a-z0-9\s" + this.punct.join('') + "])+$";
                        } else if(rule == 'decimal'){
                            regexStr = "^([0-9+-])+$";
                        } 
                        let regex = new RegExp(regexStr, 'ig');
                        let condition = !(regex.test(inputValue));
                        if(groupErrors[key]){
                            if(condition){
                                if( !errorsObj[key].length ){
                                    errorsObj[key].push(groupErrors[key][rule]); 
                                    errors.push(groupErrors[key][rule]);
                                }
                            }
                        }
                    if( isHasError ) return condition;
                    }
                    else if(/in_list\[(.+?)\]/ig.test(rule) && inputValue){
                        let regexMch = (/(in_list)\[(.+?)\]/ig.exec(rule));
                        let ruleLabel = regexMch[1];
                        let list = regexMch[2].split(',').map((el) => el.trim());
                        let condition = !list.includes(inputValue);
                        if(groupErrors[key]){
                            if(condition) {
                                if( !errorsObj[key].length ){
                                    errorsObj[key].push(groupErrors[key][ruleLabel]);
                                    errors.push(groupErrors[key][ruleLabel]);
                                }
                            }
                        }
                        if( isHasError ) return condition;
                    }
                    else if(rule.split('[')[0].endsWith('length') && inputValue){
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
                        if(groupErrors[key]){
                            if(ruleLabel == 'min_length'){
                                condition = !(inputValue.length >= len);
                            } else if(ruleLabel == 'max_length'){
                                condition = inputValue.length < len;
                            }else if(ruleLabel == 'exact_length'){
                                condition = inputValue.length !== len;
                            }
                            if( condition ) {
                                if( !errorsObj[key].length ){
                                    errorsObj[key].push(groupErrors[key][ruleLabel]);
                                    errors.push(groupErrors[key][ruleLabel]);
                                }
                            }
                        }
                        if( isHasError ) return condition;
                    }
                    else if(/(differs|matches)\[(.+?)\]$/ig.test(rule) && inputValue){
                        let regexMch = (/(.+?)\[(.+?)\]/.exec(rule));
                        let ruleLabel = regexMch[1];
                        let field = regexMch[2];
                        let condition = ruleLabel == 'matches' ? formData.get(field) !== formData.get(key) : formData.get(field) == formData.get(key)
                        if(groupErrors[key]){
                            if(condition){
                                if( !errorsObj[key].length ){
                                    errorsObj[key].push(groupErrors[key][ruleLabel]);
                                    errors.push(groupErrors[key][ruleLabel]);
                                }
                            }
                        }
                        if( isHasError ) return condition;
                    }
                    else if(rule.startsWith('less_than') && inputValue){
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
                        if(groupErrors[key]){
                            if(condition){
                                if( !errorsObj[key].length ){
                                    errorsObj[key].push(groupErrors[key][ruleLabel]);
                                    errors.push(groupErrors[key][ruleLabel]);
                                }
                            }
                        }
                        if( isHasError ) return condition;  
                    }
                    else if(rule == 'valid_email' && inputValue){
                        let regex = (/^[a-y-0-9_]+@[a-y-0-9_]+\.[a-z]{2,}$/);
                        if(groupErrors[key]){
                            if( !regex.test(inputValue) ){
                                if( !errorsObj[key].length ){
                                    errorsObj[key].push(groupErrors[key]['valid_email']);
                                    errors.push(groupErrors[key]['valid_email']);
                                }
                            }
                        }
                        if( isHasError ) return !regex.test(inputValue);
                    }
                } else {
                    let groupMethods = this.rules[group + '_methods'];
                    if(groupMethods && groupMethods[key]){
                        let customRules = Object.keys(groupMethods[key]);
                        if(customRules.includes(ruleLabel)){
                            let condition =  groupMethods[key][ruleLabel].call(this, inputValue, formData, ruleLabel);
                            if( condition ){
                                if( !errorsObj[key].length ){
                                    errorsObj[key].push(groupErrors[key][ruleLabel]);
                                    errors.push(groupErrors[key][ruleLabel]);
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