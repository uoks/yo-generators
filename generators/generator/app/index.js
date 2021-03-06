const Generator = require('yeoman-generator');
const yosay = require('yosay');
const mkdirp = require('mkdirp');
const config = require('./config');
const commandExists = require('command-exists');
const generatorPkg = require('../package.json')

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts);
        for (let optionName in config.options) {
            this.option(optionName, config.options[optionName]);
        }
        this.argument('name', { type: String, required: false });
    }

    default() {
        this.composeWith(require.resolve('../sub'), {
            arguments: ['app']
        })
    }
   
    async prompting() {
        if (!this.options['skip-welcome-message']) {
            this.log(
                yosay(
                    generatorPkg.description
                )
            )
        }
        this.answers = await this.prompt(config.prompts);
    }

    writing() {

        if (!!this.options.name) {
            // if user input the name, then should create sub dir
            this.destinationRoot(this.destinationPath(this.options.name));
        }

        const name = this.options.name || this.determineAppname();
        const generatorName = `@uoks/generator-${name}`;
        const yoName = `@uoks/${name}`;
        
        const pkg = Object.assign(generatorPkg, {
            name: generatorName,
            version: this.answers.version,
            "repository": `https://github.com/uoks/yo-generators/tree/master/generators/${name}`
        })
        pkg.description = this.answers.description;
        pkg.files = ['app'];
        this.fs.writeJSON(this.destinationPath('package.json'), pkg)

        const context = {
            generatorName,
            yoName
        }

        for (let { input, output } of config.filesToRender) {
            this.fs.copyTpl(this.templatePath(input), this.destinationPath(output), context);
        }

        for (let { input, output } of config.filesToCopy) {
            this.fs.copy(this.templatePath(input), this.destinationPath(output));
        }

        for (let item of config.dirsToCreate) {
            mkdirp(this.destinationPath(item));
        }
    }

    install() {
        const hasYarn = commandExists('yarn');
        this.installDependencies({
            npm: !hasYarn,
            yarn: hasYarn,
            bower: false,
            skipMessage: this.options['skip-install-message'],
            skipInstall: this.options['skip-install'],
        });
    }
};