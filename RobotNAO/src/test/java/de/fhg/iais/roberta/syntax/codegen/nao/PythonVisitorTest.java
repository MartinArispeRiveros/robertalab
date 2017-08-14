package de.fhg.iais.roberta.syntax.codegen.nao;

import org.junit.BeforeClass;

import de.fhg.iais.roberta.components.Configuration;
import de.fhg.iais.roberta.components.NAOConfiguration;

public class PythonVisitorTest {

    private static final String IMPORTS = "" //
        + "#!/usr/bin/python\n\n"
        + "import math\n"
        + "import time\n"
        + "from hal import Hal\n"
        + "h = Hal()\n\n"
        + "def run():\n";

    private static final String SUFFIX = "" //
        + "\ndef main():\n"
        + "    try:\n"
        + "        run()\n"
        + "    except Exception as e:\n"
        + "        h.say(\"Error!\")\n\n"
        + "if __name__ == \"__main__\":\n"
        + "    main()";

    private static Configuration brickConfiguration;

    @BeforeClass
    public static void setupConfigurationForAllTests() {
        Configuration.Builder<?> configuration = new NAOConfiguration.Builder();
        brickConfiguration = configuration.build();
    }
}
