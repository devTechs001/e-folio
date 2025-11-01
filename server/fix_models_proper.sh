#!/bin/bash
# Fix Message.model.js
sed -i "s/module\.exports = mongoose\.models\.\${1} || mongoose\.model('Message'/module.exports = mongoose.models.Message || mongoose.model('Message'/g" models/Message.model.js

# Fix Message.js
sed -i "s/module\.exports = mongoose\.models\.\${1} || mongoose\.model('Message'/module.exports = mongoose.models.Message || mongoose.model('Message'/g" models/Message.js

# Fix other common models
for model in User Project Skill Room; do
    find models -name "${model}*.js" -exec sed -i "s/module\.exports = mongoose\.models\.\${1} || mongoose\.model('${model}'/module.exports = mongoose.models.${model} || mongoose.model('${model}'/g" {} \;
done
